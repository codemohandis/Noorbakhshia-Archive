/**
 * StorageManager Skill
 * Handles all IndexedDB operations for persistent storage
 * Manages lectures, audio cache, progress, bookmarks, and settings
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Lecture,
  Collection,
  PlaybackProgress,
  Bookmark,
  Settings,
  DownloadTask,
  StorageStats,
} from '$lib/types';

// Database schema
interface NoorbakhshiaDB extends DBSchema {
  collections: {
    key: string;
    value: Collection;
    indexes: { 'by-category': string };
  };
  lectures: {
    key: string;
    value: Lecture;
    indexes: {
      'by-collection': string;
      'by-contributor': string;
    };
  };
  audioCache: {
    key: string;
    value: {
      lectureId: string;
      blob: Blob;
      size: number;
      cachedAt: number;
      lastAccessed: number;
    };
  };
  progress: {
    key: string;
    value: PlaybackProgress;
    indexes: { 'by-lastPlayed': number };
  };
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: {
      'by-lecture': string;
      'by-created': number;
    };
  };
  downloads: {
    key: string;
    value: DownloadTask;
    indexes: { 'by-status': string };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const DB_NAME = 'noorbakhshia-db';
const DB_VERSION = 2; // Bumped to reset settings to new defaults (light theme, English)

// Default settings
const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  theme: 'light',
  playbackSpeed: 1,
  skipForward: 15,
  skipBackward: 15,
  autoPlay: true,
  sleepTimer: null,
  storageLimit: 500 * 1024 * 1024, // 500 MB
  downloadQuality: 'high',
};

class StorageManager {
  private db: IDBPDatabase<NoorbakhshiaDB> | null = null;
  private dbPromise: Promise<IDBPDatabase<NoorbakhshiaDB>> | null = null;

  /**
   * Initialize the database
   */
  private async getDB(): Promise<IDBPDatabase<NoorbakhshiaDB>> {
    if (this.db) return this.db;

    if (!this.dbPromise) {
      this.dbPromise = openDB<NoorbakhshiaDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Collections store
          if (!db.objectStoreNames.contains('collections')) {
            const collectionStore = db.createObjectStore('collections', {
              keyPath: 'identifier',
            });
            collectionStore.createIndex('by-category', 'category');
          }

          // Lectures store
          if (!db.objectStoreNames.contains('lectures')) {
            const lectureStore = db.createObjectStore('lectures', {
              keyPath: 'id',
            });
            lectureStore.createIndex('by-collection', 'collectionId');
            lectureStore.createIndex('by-contributor', 'contributor');
          }

          // Audio cache store
          if (!db.objectStoreNames.contains('audioCache')) {
            db.createObjectStore('audioCache', { keyPath: 'lectureId' });
          }

          // Progress store
          if (!db.objectStoreNames.contains('progress')) {
            const progressStore = db.createObjectStore('progress', {
              keyPath: 'lectureId',
            });
            progressStore.createIndex('by-lastPlayed', 'lastPlayed');
          }

          // Bookmarks store
          if (!db.objectStoreNames.contains('bookmarks')) {
            const bookmarkStore = db.createObjectStore('bookmarks', {
              keyPath: 'id',
            });
            bookmarkStore.createIndex('by-lecture', 'lectureId');
            bookmarkStore.createIndex('by-created', 'createdAt');
          }

          // Downloads store
          if (!db.objectStoreNames.contains('downloads')) {
            const downloadStore = db.createObjectStore('downloads', {
              keyPath: 'lectureId',
            });
            downloadStore.createIndex('by-status', 'status');
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'language' });
          }

          // Version 2: Reset settings to new defaults (light theme, English)
          if (oldVersion < 2 && db.objectStoreNames.contains('settings')) {
            transaction.objectStore('settings').clear();
          }
        },
      });
    }

    this.db = await this.dbPromise;
    return this.db;
  }

  // ============ Collections ============

  async saveCollection(collection: Collection): Promise<void> {
    const db = await this.getDB();
    await db.put('collections', collection);
  }

  async getCollection(identifier: string): Promise<Collection | undefined> {
    const db = await this.getDB();
    return db.get('collections', identifier);
  }

  async getAllCollections(): Promise<Collection[]> {
    const db = await this.getDB();
    return db.getAll('collections');
  }

  async getCollectionsByCategory(category: string): Promise<Collection[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('collections', 'by-category', category);
  }

  // ============ Lectures ============

  async saveLecture(lecture: Lecture): Promise<void> {
    const db = await this.getDB();
    await db.put('lectures', lecture);
  }

  async saveLectures(lectures: Lecture[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('lectures', 'readwrite');
    await Promise.all([
      ...lectures.map((lecture) => tx.store.put(lecture)),
      tx.done,
    ]);
  }

  async getLecture(id: string): Promise<Lecture | undefined> {
    const db = await this.getDB();
    return db.get('lectures', id);
  }

  async getLecturesByCollection(collectionId: string): Promise<Lecture[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('lectures', 'by-collection', collectionId);
  }

  async getLecturesByContributor(contributor: string): Promise<Lecture[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('lectures', 'by-contributor', contributor);
  }

  // ============ Audio Cache ============

  async cacheAudio(lectureId: string, blob: Blob): Promise<void> {
    const db = await this.getDB();
    await db.put('audioCache', {
      lectureId,
      blob,
      size: blob.size,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
    });
  }

  async getCachedAudio(lectureId: string): Promise<Blob | undefined> {
    const db = await this.getDB();
    const cached = await db.get('audioCache', lectureId);
    if (cached) {
      // Update last accessed time
      await db.put('audioCache', {
        ...cached,
        lastAccessed: Date.now(),
      });
      return cached.blob;
    }
    return undefined;
  }

  async isAudioCached(lectureId: string): Promise<boolean> {
    const db = await this.getDB();
    const cached = await db.get('audioCache', lectureId);
    return !!cached;
  }

  async deleteCachedAudio(lectureId: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('audioCache', lectureId);
  }

  async getAllCachedAudioIds(): Promise<string[]> {
    const db = await this.getDB();
    return db.getAllKeys('audioCache');
  }

  /**
   * Get least recently used audio files
   */
  async getLRUCachedAudio(limit: number): Promise<string[]> {
    const db = await this.getDB();
    const all = await db.getAll('audioCache');
    all.sort((a, b) => a.lastAccessed - b.lastAccessed);
    return all.slice(0, limit).map((item) => item.lectureId);
  }

  // ============ Progress ============

  async saveProgress(progress: PlaybackProgress): Promise<void> {
    const db = await this.getDB();
    await db.put('progress', progress);
  }

  async getProgress(lectureId: string): Promise<PlaybackProgress | undefined> {
    const db = await this.getDB();
    return db.get('progress', lectureId);
  }

  async getRecentlyPlayed(limit = 10): Promise<PlaybackProgress[]> {
    const db = await this.getDB();
    const all = await db.getAllFromIndex('progress', 'by-lastPlayed');
    // Sort descending (most recent first)
    all.sort((a, b) => b.lastPlayed - a.lastPlayed);
    return all.slice(0, limit);
  }

  async deleteProgress(lectureId: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('progress', lectureId);
  }

  // ============ Bookmarks ============

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    const db = await this.getDB();
    await db.put('bookmarks', bookmark);
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    const db = await this.getDB();
    return db.get('bookmarks', id);
  }

  async getBookmarksByLecture(lectureId: string): Promise<Bookmark[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('bookmarks', 'by-lecture', lectureId);
  }

  async getAllBookmarks(): Promise<Bookmark[]> {
    const db = await this.getDB();
    const all = await db.getAllFromIndex('bookmarks', 'by-created');
    // Sort descending (most recent first)
    return all.reverse();
  }

  async deleteBookmark(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('bookmarks', id);
  }

  // ============ Downloads ============

  async saveDownloadTask(task: DownloadTask): Promise<void> {
    const db = await this.getDB();
    await db.put('downloads', task);
  }

  async getDownloadTask(lectureId: string): Promise<DownloadTask | undefined> {
    const db = await this.getDB();
    return db.get('downloads', lectureId);
  }

  async getDownloadsByStatus(status: DownloadTask['status']): Promise<DownloadTask[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('downloads', 'by-status', status);
  }

  async getAllDownloads(): Promise<DownloadTask[]> {
    const db = await this.getDB();
    return db.getAll('downloads');
  }

  async deleteDownloadTask(lectureId: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('downloads', lectureId);
  }

  // ============ Settings ============

  async saveSettings(settings: Settings): Promise<void> {
    const db = await this.getDB();
    await db.put('settings', settings);
  }

  async getSettings(): Promise<Settings> {
    const db = await this.getDB();
    const settings = await db.get('settings', 'ur');
    return settings || DEFAULT_SETTINGS;
  }

  // ============ Storage Management ============

  async getStorageStats(): Promise<StorageStats> {
    const db = await this.getDB();

    // Calculate audio cache size
    const audioCache = await db.getAll('audioCache');
    const audioSize = audioCache.reduce((total, item) => total + item.size, 0);

    // Get storage estimate if available
    let quota = 0;
    let used = 0;

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      quota = estimate.quota || 0;
      used = estimate.usage || 0;
    }

    return {
      used,
      available: quota - used,
      quota,
      usedPercentage: quota > 0 ? (used / quota) * 100 : 0,
      audioSize,
      cacheSize: used - audioSize,
    };
  }

  /**
   * Evict audio cache to free up space
   * Uses LRU (Least Recently Used) policy
   */
  async evictToFreeSpace(targetBytes: number): Promise<number> {
    const db = await this.getDB();
    const allCached = await db.getAll('audioCache');

    // Sort by last accessed (oldest first)
    allCached.sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedBytes = 0;
    const toDelete: string[] = [];

    for (const item of allCached) {
      if (freedBytes >= targetBytes) break;
      toDelete.push(item.lectureId);
      freedBytes += item.size;
    }

    // Delete in batch
    const tx = db.transaction('audioCache', 'readwrite');
    await Promise.all([
      ...toDelete.map((id) => tx.store.delete(id)),
      tx.done,
    ]);

    return freedBytes;
  }

  /**
   * Clear all cached data except settings
   */
  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(
      ['collections', 'lectures', 'audioCache', 'progress', 'bookmarks', 'downloads'],
      'readwrite'
    );
    await Promise.all([
      tx.objectStore('collections').clear(),
      tx.objectStore('lectures').clear(),
      tx.objectStore('audioCache').clear(),
      tx.objectStore('progress').clear(),
      tx.objectStore('bookmarks').clear(),
      tx.objectStore('downloads').clear(),
      tx.done,
    ]);
  }

  /**
   * Clear only audio cache
   */
  async clearAudioCache(): Promise<void> {
    const db = await this.getDB();
    await db.clear('audioCache');
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Export class for testing
export { StorageManager, DEFAULT_SETTINGS };
