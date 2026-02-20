/**
 * Downloads Store
 * Re-exports download manager stores for easier access
 */

import { derived, type Readable } from 'svelte/store';
import { downloadManager } from '$lib/services/download-manager';
import type { Lecture, DownloadTask, StorageStats } from '$lib/types';

// Re-export the download manager with a cleaner API
export const downloads = {
  subscribe: downloadManager.subscribe,

  // Queue operations
  queue: (lecture: Lecture) => downloadManager.queueDownload(lecture),
  queueMultiple: (lectures: Lecture[]) => downloadManager.queueMultiple(lectures),

  // Control operations
  pause: (lectureId: string) => downloadManager.pauseDownload(lectureId),
  resume: (lectureId: string) => downloadManager.resumeDownload(lectureId),
  cancel: (lectureId: string) => downloadManager.cancelDownload(lectureId),
  retry: (lectureId: string) => downloadManager.retryDownload(lectureId),

  // Batch operations
  pauseAll: () => downloadManager.pauseAll(),
  resumeAll: () => downloadManager.resumeAll(),
  clearAll: () => downloadManager.clearAll(),

  // Status checks
  getStatus: (lectureId: string) => downloadManager.getDownloadStatus(lectureId),
  isDownloaded: (lectureId: string) => downloadManager.isDownloaded(lectureId),

  // Storage
  getStorageStats: () => downloadManager.getStorageStats(),
  freeUpSpace: (bytes: number) => downloadManager.freeUpSpace(bytes),
};

// Derived stores for selective subscriptions
export const allTasks: Readable<DownloadTask[]> = derived(
  { subscribe: downloadManager.subscribe },
  ($state) => Array.from($state.tasks.values())
);

export const pendingTasks: Readable<DownloadTask[]> = derived(
  allTasks,
  ($tasks) => $tasks.filter((t) => t.status === 'pending')
);

export const downloadingTasks: Readable<DownloadTask[]> = derived(
  allTasks,
  ($tasks) => $tasks.filter((t) => t.status === 'downloading')
);

export const completedTasks: Readable<DownloadTask[]> = derived(
  allTasks,
  ($tasks) => $tasks.filter((t) => t.status === 'completed')
);

export const failedTasks: Readable<DownloadTask[]> = derived(
  allTasks,
  ($tasks) => $tasks.filter((t) => t.status === 'failed')
);

export const pausedTasks: Readable<DownloadTask[]> = derived(
  allTasks,
  ($tasks) => $tasks.filter((t) => t.status === 'paused')
);

export const activeTasks: Readable<DownloadTask[]> = derived(
  allTasks,
  ($tasks) => $tasks.filter((t) => t.status === 'downloading' || t.status === 'pending')
);

export const pendingCount: Readable<number> = derived(
  pendingTasks,
  ($tasks) => $tasks.length
);

export const downloadingCount: Readable<number> = derived(
  downloadingTasks,
  ($tasks) => $tasks.length
);

export const completedCount: Readable<number> = derived(
  completedTasks,
  ($tasks) => $tasks.length
);

export const hasActiveDownloads: Readable<boolean> = derived(
  activeTasks,
  ($tasks) => $tasks.length > 0
);

export const isPaused: Readable<boolean> = derived(
  { subscribe: downloadManager.subscribe },
  ($state) => $state.isPaused
);

// Total download progress (for badge or indicator)
export const totalProgress: Readable<number> = derived(
  downloadingTasks,
  ($tasks) => {
    if ($tasks.length === 0) return 0;
    const total = $tasks.reduce((sum, t) => sum + t.progress, 0);
    return total / $tasks.length;
  }
);

// Total bytes being downloaded
export const totalBytes: Readable<{ downloaded: number; total: number }> = derived(
  downloadingTasks,
  ($tasks) => {
    const downloaded = $tasks.reduce((sum, t) => sum + t.bytesDownloaded, 0);
    const total = $tasks.reduce((sum, t) => sum + t.totalBytes, 0);
    return { downloaded, total };
  }
);

// Helper to check if a specific lecture is downloading
export function isDownloading(lectureId: string): Readable<boolean> {
  return derived(allTasks, ($tasks) => {
    const task = $tasks.find((t) => t.lectureId === lectureId);
    return task?.status === 'downloading';
  });
}

// Helper to get download progress for a specific lecture
export function getDownloadProgress(lectureId: string): Readable<number> {
  return derived(allTasks, ($tasks) => {
    const task = $tasks.find((t) => t.lectureId === lectureId);
    return task?.progress || 0;
  });
}

// Helper to get download status for a specific lecture
export function getDownloadStatus(lectureId: string): Readable<DownloadTask['status'] | null> {
  return derived(allTasks, ($tasks) => {
    const task = $tasks.find((t) => t.lectureId === lectureId);
    return task?.status || null;
  });
}
