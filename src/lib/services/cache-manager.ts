/**
 * CacheManager Skill
 * Manages service worker caching strategies
 * Coordinates with PWA service worker for offline support
 */

import { browser } from '$app/environment';

// Cache names
export const CACHE_NAMES = {
  APP_SHELL: 'app-shell-v1',
  METADATA: 'archive-metadata',
  AUDIO: 'archive-audio',
  IMAGES: 'images',
  FONTS: 'fonts',
} as const;

// Cache TTLs in milliseconds
export const CACHE_TTL = {
  METADATA: 24 * 60 * 60 * 1000, // 24 hours
  AUDIO: 30 * 24 * 60 * 60 * 1000, // 30 days
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
  FONTS: 365 * 24 * 60 * 60 * 1000, // 1 year
} as const;

type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';

interface CacheConfig {
  strategy: CacheStrategy;
  cacheName: string;
  ttl: number;
  maxEntries?: number;
}

class CacheManager {
  private cacheConfigs: Map<RegExp, CacheConfig> = new Map();

  constructor() {
    this.setupCacheStrategies();
  }

  /**
   * Configure caching strategies for different URL patterns
   */
  private setupCacheStrategies(): void {
    // Metadata API - Stale While Revalidate
    this.cacheConfigs.set(/^https:\/\/archive\.org\/metadata\//, {
      strategy: 'stale-while-revalidate',
      cacheName: CACHE_NAMES.METADATA,
      ttl: CACHE_TTL.METADATA,
      maxEntries: 100,
    });

    // Audio files - Cache First (for downloaded content)
    this.cacheConfigs.set(/^https:\/\/archive\.org\/download\/.*\.(mp3|ogg|flac)/i, {
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.AUDIO,
      ttl: CACHE_TTL.AUDIO,
    });

    // Images - Cache First
    this.cacheConfigs.set(/\.(png|jpg|jpeg|gif|webp|svg)$/i, {
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.IMAGES,
      ttl: CACHE_TTL.IMAGES,
      maxEntries: 100,
    });

    // Fonts - Cache First with long TTL
    this.cacheConfigs.set(/\.(woff|woff2|ttf|otf)$/i, {
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.FONTS,
      ttl: CACHE_TTL.FONTS,
      maxEntries: 20,
    });

    // Google Fonts
    this.cacheConfigs.set(/^https:\/\/fonts\.(googleapis|gstatic)\.com/, {
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.FONTS,
      ttl: CACHE_TTL.FONTS,
      maxEntries: 30,
    });
  }

  /**
   * Get cache strategy for a URL
   */
  getStrategyForUrl(url: string): CacheConfig | undefined {
    for (const [pattern, config] of this.cacheConfigs) {
      if (pattern.test(url)) {
        return config;
      }
    }
    return undefined;
  }

  /**
   * Pre-cache essential resources
   */
  async precacheEssentials(): Promise<void> {
    if (!browser) return;

    const essentialUrls = [
      '/',
      '/library',
      '/settings',
      '/manifest.webmanifest',
    ];

    try {
      const cache = await caches.open(CACHE_NAMES.APP_SHELL);
      await cache.addAll(essentialUrls);
    } catch (error) {
      console.error('Failed to precache essentials:', error);
    }
  }

  /**
   * Cache a specific resource
   */
  async cacheResource(url: string, response?: Response): Promise<void> {
    if (!browser) return;

    const config = this.getStrategyForUrl(url);
    if (!config) return;

    try {
      const cache = await caches.open(config.cacheName);

      if (response) {
        await cache.put(url, response.clone());
      } else {
        await cache.add(url);
      }
    } catch (error) {
      console.error('Failed to cache resource:', error);
    }
  }

  /**
   * Get cached resource
   */
  async getCachedResource(url: string): Promise<Response | undefined> {
    if (!browser) return undefined;

    const config = this.getStrategyForUrl(url);
    if (!config) return undefined;

    try {
      const cache = await caches.open(config.cacheName);
      const response = await cache.match(url);
      return response || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if resource is cached
   */
  async isCached(url: string): Promise<boolean> {
    const cached = await this.getCachedResource(url);
    return !!cached;
  }

  /**
   * Delete cached resource
   */
  async deleteCachedResource(url: string): Promise<boolean> {
    if (!browser) return false;

    const config = this.getStrategyForUrl(url);
    if (!config) return false;

    try {
      const cache = await caches.open(config.cacheName);
      return await cache.delete(url);
    } catch {
      return false;
    }
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName: string): Promise<boolean> {
    if (!browser) return false;

    try {
      return await caches.delete(cacheName);
    } catch {
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    if (!browser) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * Get cache storage usage
   */
  async getCacheStorageUsage(): Promise<{ used: number; quota: number }> {
    if (!browser) return { used: 0, quota: 0 };

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }

    return { used: 0, quota: 0 };
  }

  /**
   * Check if service worker is registered
   */
  async isServiceWorkerReady(): Promise<boolean> {
    if (!browser || !('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration?.active;
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!browser) return false;

    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }

    return false;
  }

  /**
   * Check if storage is persistent
   */
  async isStoragePersistent(): Promise<boolean> {
    if (!browser) return false;

    if ('storage' in navigator && 'persisted' in navigator.storage) {
      return await navigator.storage.persisted();
    }

    return false;
  }

  /**
   * Clean up old caches (for cache versioning)
   */
  async cleanupOldCaches(currentVersions: string[]): Promise<void> {
    if (!browser) return;

    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter((name) => !currentVersions.includes(name));
      await Promise.all(oldCaches.map((name) => caches.delete(name)));
    } catch (error) {
      console.error('Failed to cleanup old caches:', error);
    }
  }

  /**
   * Update app cache (trigger service worker update)
   */
  async updateApp(): Promise<void> {
    if (!browser || !('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async activateNewServiceWorker(): Promise<void> {
    if (!browser || !('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export class for testing
export { CacheManager };
