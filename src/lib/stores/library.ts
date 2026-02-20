/**
 * Library Store
 * Manages collections, lectures, and library data
 */

import { writable, derived, get, type Readable, type Writable } from 'svelte/store';
import type { Collection, Lecture, PlaybackProgress, Bookmark } from '$lib/types';
import { collectionManager } from '$lib/services/collection-manager';
import { archiveFetcher } from '$lib/services/archive-fetcher';
import { metadataNormalizer } from '$lib/services/metadata-normalizer';
import { storageManager } from '$lib/services/storage-manager';

interface LibraryState {
  collections: Collection[];
  lectures: Map<string, Lecture[]>;
  recentlyPlayed: PlaybackProgress[];
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: LibraryState = {
  collections: [],
  lectures: new Map(),
  recentlyPlayed: [],
  bookmarks: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

function createLibraryStore() {
  const store: Writable<LibraryState> = writable(initialState);
  const { subscribe, update, set } = store;

  return {
    subscribe,

    /**
     * Initialize library from storage and config
     */
    async initialize(): Promise<void> {
      update((s) => ({ ...s, isLoading: true, error: null }));

      try {
        // First, show all collections from config immediately (for fast UI)
        const configs = collectionManager.getAllCollections();
        const initialCollections: Collection[] = configs.map((config) =>
          collectionManager.enrichCollection(config)
        );

        // Load from IndexedDB (for offline/cached data)
        const [storedCollections, recentlyPlayed, bookmarks] = await Promise.all([
          storageManager.getAllCollections(),
          storageManager.getRecentlyPlayed(10),
          storageManager.getAllBookmarks(),
        ]);

        // Merge stored data with config data
        const collectionsMap = new Map<string, Collection>();

        // Start with config-based collections
        for (const col of initialCollections) {
          collectionsMap.set(col.identifier, col);
        }

        // Overlay stored collections (they have enriched metadata)
        for (const col of storedCollections) {
          collectionsMap.set(col.identifier, col);
        }

        const lecturesMap = new Map<string, Lecture[]>();
        for (const collection of storedCollections) {
          const lectures = await storageManager.getLecturesByCollection(collection.identifier);
          if (lectures.length > 0) {
            lecturesMap.set(collection.identifier, lectures);
          }
        }

        update((s) => ({
          ...s,
          collections: Array.from(collectionsMap.values()),
          lectures: lecturesMap,
          recentlyPlayed,
          bookmarks,
          isLoading: false,
        }));

        // Then try to refresh from API in background
        this.refreshFromApi();
      } catch (error) {
        update((s) => ({
          ...s,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load library',
        }));
      }
    },

    /**
     * Refresh library data from Archive.org API
     * Uses batched requests with concurrency control
     */
    async refreshFromApi(): Promise<void> {
      const configs = collectionManager.getAllCollections();
      const BATCH_SIZE = 5; // Fetch 5 at a time

      const fetchCollection = async (config: typeof configs[0]) => {
        try {
          const metadata = await archiveFetcher.fetchMetadata(config.identifier);
          const collection = metadataNormalizer.normalizeCollection(metadata, config);
          const lectures = metadataNormalizer.normalizeLectures(metadata, config);

          // Save to IndexedDB
          await storageManager.saveCollection(collection);
          await storageManager.saveLectures(lectures);

          // Update store
          update((s) => {
            const newCollections = [...s.collections.filter((c) => c.identifier !== config.identifier), collection];
            const newLectures = new Map(s.lectures);
            newLectures.set(config.identifier, lectures);

            return {
              ...s,
              collections: newCollections,
              lectures: newLectures,
              lastFetched: Date.now(),
            };
          });
        } catch (error) {
          console.error(`Failed to fetch ${config.identifier}:`, error);
        }
      };

      // Process in batches for better performance
      for (let i = 0; i < configs.length; i += BATCH_SIZE) {
        const batch = configs.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(fetchCollection));
      }
    },

    /**
     * Get collection by identifier
     */
    async getCollection(identifier: string): Promise<Collection | undefined> {
      const state = get(store);
      let collection = state.collections.find((c) => c.identifier === identifier);

      if (!collection) {
        // Try to fetch from API
        const config = collectionManager.getCollection(identifier);
        if (config) {
          try {
            const metadata = await archiveFetcher.fetchMetadata(identifier);
            collection = metadataNormalizer.normalizeCollection(metadata, config);
            await storageManager.saveCollection(collection);

            update((s) => ({
              ...s,
              collections: [...s.collections, collection!],
            }));
          } catch {
            collection = await storageManager.getCollection(identifier);
          }
        }
      }

      return collection;
    },

    /**
     * Get lectures for a collection
     */
    async getLectures(collectionId: string): Promise<Lecture[]> {
      const state = get(store);
      let lectures = state.lectures.get(collectionId);

      if (!lectures || lectures.length === 0) {
        // Try to fetch from API
        const config = collectionManager.getCollection(collectionId);
        if (config) {
          try {
            const metadata = await archiveFetcher.fetchMetadata(collectionId);
            lectures = metadataNormalizer.normalizeLectures(metadata, config);
            await storageManager.saveLectures(lectures);

            update((s) => {
              const newLectures = new Map(s.lectures);
              newLectures.set(collectionId, lectures!);
              return { ...s, lectures: newLectures };
            });
          } catch {
            lectures = await storageManager.getLecturesByCollection(collectionId);
          }
        }
      }

      return lectures || [];
    },

    /**
     * Get a specific lecture
     */
    async getLecture(lectureId: string): Promise<Lecture | undefined> {
      // Check all loaded lectures
      const state = get(store);
      for (const lectures of state.lectures.values()) {
        const found = lectures.find((l) => l.id === lectureId);
        if (found) return found;
      }

      // Try IndexedDB
      return storageManager.getLecture(lectureId);
    },

    /**
     * Get recently played lectures with progress
     */
    async getRecentlyPlayed(): Promise<{ lecture: Lecture; progress: PlaybackProgress }[]> {
      const recentProgress = await storageManager.getRecentlyPlayed(10);
      const result: { lecture: Lecture; progress: PlaybackProgress }[] = [];

      for (const progress of recentProgress) {
        const lecture = await this.getLecture(progress.lectureId);
        if (lecture) {
          result.push({ lecture, progress });
        }
      }

      return result;
    },

    /**
     * Add or update bookmark
     */
    async addBookmark(lectureId: string, position: number, note?: string): Promise<Bookmark> {
      const bookmark: Bookmark = {
        id: `${lectureId}-${Date.now()}`,
        lectureId,
        position,
        note,
        createdAt: Date.now(),
      };

      await storageManager.saveBookmark(bookmark);

      update((s) => ({
        ...s,
        bookmarks: [bookmark, ...s.bookmarks],
      }));

      return bookmark;
    },

    /**
     * Remove bookmark
     */
    async removeBookmark(bookmarkId: string): Promise<void> {
      await storageManager.deleteBookmark(bookmarkId);

      update((s) => ({
        ...s,
        bookmarks: s.bookmarks.filter((b) => b.id !== bookmarkId),
      }));
    },

    /**
     * Get bookmarks for a lecture
     */
    async getBookmarksForLecture(lectureId: string): Promise<Bookmark[]> {
      return storageManager.getBookmarksByLecture(lectureId);
    },

    /**
     * Search lectures, collections, and topics
     */
    async searchLectures(query: string): Promise<Lecture[]> {
      const state = get(store);
      const results: Lecture[] = [];
      const queryLower = query.toLowerCase();

      for (const lectures of state.lectures.values()) {
        for (const lecture of lectures) {
          if (
            lecture.title.toLowerCase().includes(queryLower) ||
            lecture.titleEn?.toLowerCase().includes(queryLower) ||
            lecture.contributor.toLowerCase().includes(queryLower)
          ) {
            results.push(lecture);
          }
        }
      }

      return results;
    },

    /**
     * Search all content: lectures, collections, and categories
     */
    async searchAll(query: string): Promise<{ lectures: Lecture[]; collections: Collection[]; }> {
      const state = get(store);
      const queryLower = query.toLowerCase();
      const lectureResults: Lecture[] = [];
      const collectionResults: Collection[] = [];

      // Search lectures
      for (const lectures of state.lectures.values()) {
        for (const lecture of lectures) {
          if (
            lecture.title.toLowerCase().includes(queryLower) ||
            lecture.titleEn?.toLowerCase().includes(queryLower) ||
            lecture.contributor.toLowerCase().includes(queryLower)
          ) {
            lectureResults.push(lecture);
          }
        }
      }

      // Search collections by title, description, and contributor
      for (const collection of state.collections) {
        if (
          collection.title.toLowerCase().includes(queryLower) ||
          collection.displayName?.toLowerCase().includes(queryLower) ||
          collection.creator?.toLowerCase().includes(queryLower) ||
          collection.contributor?.toLowerCase().includes(queryLower) ||
          collection.subject?.toLowerCase().includes(queryLower) ||
          collection.album?.toLowerCase().includes(queryLower)
        ) {
          collectionResults.push(collection);
        }
      }

      return {
        lectures: lectureResults,
        collections: collectionResults
      };
    },

    /**
     * Get downloaded lectures
     */
    async getDownloadedLectures(): Promise<Lecture[]> {
      const state = get(store);
      const downloadedIds = await storageManager.getAllCachedAudioIds();
      const downloadedSet = new Set(downloadedIds);
      const results: Lecture[] = [];

      for (const lectures of state.lectures.values()) {
        for (const lecture of lectures) {
          if (downloadedSet.has(lecture.id)) {
            results.push({ ...lecture, isDownloaded: true });
          }
        }
      }

      return results;
    },

    /**
     * Clear all library data
     */
    async clearAll(): Promise<void> {
      await storageManager.clearAllData();
      set(initialState);
    },

    /**
     * Get state snapshot
     */
    getState(): LibraryState {
      return get(store);
    },
  };
}

// Create and export the library store
export const library = createLibraryStore();

// Derived stores for common access patterns
export const collections: Readable<Collection[]> = derived(
  { subscribe: library.subscribe },
  ($state) => $state.collections
);

export const featuredCollections: Readable<Collection[]> = derived(
  collections,
  ($collections) => $collections.filter((c) => c.featured)
);

export const isLibraryLoading: Readable<boolean> = derived(
  { subscribe: library.subscribe },
  ($state) => $state.isLoading
);

export const libraryError: Readable<string | null> = derived(
  { subscribe: library.subscribe },
  ($state) => $state.error
);

export const bookmarks: Readable<Bookmark[]> = derived(
  { subscribe: library.subscribe },
  ($state) => $state.bookmarks
);
