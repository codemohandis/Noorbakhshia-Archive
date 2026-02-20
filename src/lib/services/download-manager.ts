/**
 * DownloadManager Skill
 * Handles offline audio caching with download queue, progress tracking,
 * quota management, and LRU eviction policy
 */

import { writable, get, derived, type Readable } from 'svelte/store';
import type { Lecture, DownloadTask, StorageStats } from '$lib/types';
import { storageManager } from './storage-manager';
import { archiveFetcher } from './archive-fetcher';

// Download configuration
const MAX_CONCURRENT_DOWNLOADS = 2;
const STORAGE_BUFFER_MB = 50; // Keep 50MB free

interface DownloadManagerState {
  tasks: Map<string, DownloadTask>;
  activeDownloads: Set<string>;
  isPaused: boolean;
  totalProgress: number;
  error: string | null;
}

const initialState: DownloadManagerState = {
  tasks: new Map(),
  activeDownloads: new Set(),
  isPaused: false,
  totalProgress: 0,
  error: null,
};

class DownloadManager {
  private store = writable<DownloadManagerState>(initialState);
  private abortControllers: Map<string, AbortController> = new Map();

  public subscribe = this.store.subscribe;

  // Derived stores
  public pendingCount: Readable<number> = derived(this.store, ($s) =>
    Array.from($s.tasks.values()).filter((t) => t.status === 'pending').length
  );
  public downloadingCount: Readable<number> = derived(this.store, ($s) =>
    Array.from($s.tasks.values()).filter((t) => t.status === 'downloading').length
  );
  public completedCount: Readable<number> = derived(this.store, ($s) =>
    Array.from($s.tasks.values()).filter((t) => t.status === 'completed').length
  );

  constructor() {
    // Load existing download tasks on init
    if (typeof window !== 'undefined') {
      this.loadExistingTasks();
    }
  }

  private async loadExistingTasks(): Promise<void> {
    const tasks = await storageManager.getAllDownloads();
    const tasksMap = new Map<string, DownloadTask>();

    for (const task of tasks) {
      // Reset any interrupted downloads to pending
      if (task.status === 'downloading') {
        task.status = 'pending';
        task.progress = 0;
      }
      tasksMap.set(task.lectureId, task);
    }

    this.store.update((s) => ({ ...s, tasks: tasksMap }));
  }

  /**
   * Get current state
   */
  private getState(): DownloadManagerState {
    return get(this.store);
  }

  /**
   * Update a specific task
   */
  private updateTask(lectureId: string, updates: Partial<DownloadTask>): void {
    this.store.update((s) => {
      const task = s.tasks.get(lectureId);
      if (task) {
        const updatedTask = { ...task, ...updates };
        s.tasks.set(lectureId, updatedTask);
        // Persist to IndexedDB
        storageManager.saveDownloadTask(updatedTask);
      }
      return { ...s };
    });
  }

  /**
   * Queue a lecture for download
   */
  async queueDownload(lecture: Lecture): Promise<void> {
    const state = this.getState();

    // Check if already queued or downloaded
    if (state.tasks.has(lecture.id)) {
      const task = state.tasks.get(lecture.id)!;
      if (task.status === 'completed' || task.status === 'downloading') {
        return;
      }
    }

    // Check storage availability
    const canDownload = await this.checkStorageAvailability(lecture.fileSize);
    if (!canDownload) {
      throw new Error('Insufficient storage space. Please free up some space.');
    }

    // Create download task
    const task: DownloadTask = {
      lectureId: lecture.id,
      status: 'pending',
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: lecture.fileSize,
    };

    this.store.update((s) => {
      s.tasks.set(lecture.id, task);
      return { ...s };
    });

    await storageManager.saveDownloadTask(task);

    // Start processing queue
    this.processQueue();
  }

  /**
   * Queue multiple lectures for download
   */
  async queueMultiple(lectures: Lecture[]): Promise<void> {
    for (const lecture of lectures) {
      try {
        await this.queueDownload(lecture);
      } catch (error) {
        console.error(`Failed to queue ${lecture.id}:`, error);
      }
    }
  }

  /**
   * Process the download queue
   */
  private async processQueue(): Promise<void> {
    const state = this.getState();

    if (state.isPaused) return;

    // Get pending tasks
    const pendingTasks = Array.from(state.tasks.values()).filter(
      (t) => t.status === 'pending'
    );

    // Check how many we can start
    const slotsAvailable = MAX_CONCURRENT_DOWNLOADS - state.activeDownloads.size;

    if (slotsAvailable <= 0 || pendingTasks.length === 0) return;

    // Start downloads for available slots
    const tasksToStart = pendingTasks.slice(0, slotsAvailable);

    for (const task of tasksToStart) {
      this.startDownload(task.lectureId);
    }
  }

  /**
   * Start downloading a specific task
   */
  private async startDownload(lectureId: string): Promise<void> {
    const lecture = await storageManager.getLecture(lectureId);
    if (!lecture) {
      this.updateTask(lectureId, { status: 'failed', error: 'Lecture not found' });
      return;
    }

    // Create abort controller
    const abortController = new AbortController();
    this.abortControllers.set(lectureId, abortController);

    // Mark as downloading
    this.updateTask(lectureId, {
      status: 'downloading',
      startedAt: Date.now(),
    });

    this.store.update((s) => {
      s.activeDownloads.add(lectureId);
      return { ...s };
    });

    try {
      // Extract identifier and filename from URL
      const urlParts = lecture.fileUrl.match(/\/download\/([^/]+)\/(.+)$/);
      if (!urlParts) {
        throw new Error('Invalid file URL');
      }

      const [, identifier, fileName] = urlParts;

      // Download with progress tracking
      const blob = await archiveFetcher.fetchAudioWithProgress(
        identifier,
        decodeURIComponent(fileName),
        (loaded, total) => {
          const progress = total > 0 ? (loaded / total) * 100 : 0;
          this.updateTask(lectureId, {
            progress,
            bytesDownloaded: loaded,
            totalBytes: total,
          });
        },
        abortController.signal
      );

      // Save to IndexedDB
      await storageManager.cacheAudio(lectureId, blob);

      // Update lecture as downloaded
      const updatedLecture = { ...lecture, isDownloaded: true, downloadedAt: Date.now() };
      await storageManager.saveLecture(updatedLecture);

      // Mark as completed
      this.updateTask(lectureId, {
        status: 'completed',
        progress: 100,
        bytesDownloaded: blob.size,
        completedAt: Date.now(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.updateTask(lectureId, {
          status: 'paused',
          error: 'Download cancelled',
        });
      } else {
        this.updateTask(lectureId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } finally {
      this.abortControllers.delete(lectureId);
      this.store.update((s) => {
        s.activeDownloads.delete(lectureId);
        return { ...s };
      });

      // Process next in queue
      this.processQueue();
    }
  }

  /**
   * Pause a specific download
   */
  pauseDownload(lectureId: string): void {
    const controller = this.abortControllers.get(lectureId);
    if (controller) {
      controller.abort();
    }
    this.updateTask(lectureId, { status: 'paused' });
  }

  /**
   * Resume a paused download
   */
  resumeDownload(lectureId: string): void {
    this.updateTask(lectureId, { status: 'pending' });
    this.processQueue();
  }

  /**
   * Cancel and remove a download
   */
  async cancelDownload(lectureId: string): Promise<void> {
    // Abort if in progress
    const controller = this.abortControllers.get(lectureId);
    if (controller) {
      controller.abort();
    }

    // Remove from stores
    this.store.update((s) => {
      s.tasks.delete(lectureId);
      s.activeDownloads.delete(lectureId);
      return { ...s };
    });

    await storageManager.deleteDownloadTask(lectureId);
    await storageManager.deleteCachedAudio(lectureId);

    // Update lecture
    const lecture = await storageManager.getLecture(lectureId);
    if (lecture) {
      lecture.isDownloaded = false;
      lecture.downloadedAt = undefined;
      await storageManager.saveLecture(lecture);
    }
  }

  /**
   * Retry a failed download
   */
  retryDownload(lectureId: string): void {
    this.updateTask(lectureId, {
      status: 'pending',
      progress: 0,
      bytesDownloaded: 0,
      error: undefined,
    });
    this.processQueue();
  }

  /**
   * Pause all downloads
   */
  pauseAll(): void {
    this.store.update((s) => ({ ...s, isPaused: true }));

    // Abort all active downloads
    for (const [lectureId, controller] of this.abortControllers) {
      controller.abort();
      this.updateTask(lectureId, { status: 'paused' });
    }
  }

  /**
   * Resume all downloads
   */
  resumeAll(): void {
    this.store.update((s) => ({ ...s, isPaused: false }));

    // Reset paused to pending
    const state = this.getState();
    for (const [lectureId, task] of state.tasks) {
      if (task.status === 'paused') {
        this.updateTask(lectureId, { status: 'pending' });
      }
    }

    this.processQueue();
  }

  /**
   * Check if there's enough storage space
   */
  private async checkStorageAvailability(requiredBytes: number): Promise<boolean> {
    const stats = await storageManager.getStorageStats();
    const bufferBytes = STORAGE_BUFFER_MB * 1024 * 1024;

    return stats.available > requiredBytes + bufferBytes;
  }

  /**
   * Free up storage space using LRU eviction
   */
  async freeUpSpace(requiredBytes: number): Promise<boolean> {
    const stats = await storageManager.getStorageStats();

    if (stats.available >= requiredBytes) {
      return true;
    }

    const bytesToFree = requiredBytes - stats.available + STORAGE_BUFFER_MB * 1024 * 1024;
    const freedBytes = await storageManager.evictToFreeSpace(bytesToFree);

    // Remove corresponding download tasks
    const cachedIds = await storageManager.getAllCachedAudioIds();
    const state = this.getState();

    for (const [lectureId, task] of state.tasks) {
      if (task.status === 'completed' && !cachedIds.includes(lectureId)) {
        this.store.update((s) => {
          s.tasks.delete(lectureId);
          return { ...s };
        });
        await storageManager.deleteDownloadTask(lectureId);
      }
    }

    return freedBytes >= bytesToFree;
  }

  /**
   * Get download status for a lecture
   */
  getDownloadStatus(lectureId: string): DownloadTask | undefined {
    return this.getState().tasks.get(lectureId);
  }

  /**
   * Check if a lecture is downloaded
   */
  async isDownloaded(lectureId: string): Promise<boolean> {
    return storageManager.isAudioCached(lectureId);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    return storageManager.getStorageStats();
  }

  /**
   * Clear all downloads and cached audio
   */
  async clearAll(): Promise<void> {
    // Abort all active downloads
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }

    this.store.set(initialState);
    await storageManager.clearAudioCache();

    // Clear all download tasks
    const tasks = await storageManager.getAllDownloads();
    for (const task of tasks) {
      await storageManager.deleteDownloadTask(task.lectureId);
    }
  }
}

// Export singleton instance
export const downloadManager = new DownloadManager();

// Export class for testing
export { DownloadManager };
