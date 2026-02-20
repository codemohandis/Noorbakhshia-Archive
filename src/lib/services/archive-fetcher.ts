/**
 * ArchiveFetcher Skill
 * Handles all Archive.org API interactions
 * Provides metadata fetching, audio format detection, and retry logic
 */

import ky from 'ky';
import type { ArchiveMetadata, ArchiveFile } from '$lib/types';

// Archive.org API configuration
const ARCHIVE_API_BASE = 'https://archive.org';
const METADATA_ENDPOINT = '/metadata';
const DOWNLOAD_ENDPOINT = '/download';

// Supported audio formats (in order of preference)
const AUDIO_FORMATS = ['VBR MP3', 'MP3', '128Kbps MP3', '64Kbps MP3', 'OGG', 'FLAC'];

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface FetchOptions {
  retries?: number;
  timeout?: number;
  signal?: AbortSignal;
}

class ArchiveFetcher {
  private api: typeof ky;
  private cache: Map<string, { data: ArchiveMetadata; timestamp: number }>;
  private cacheMaxAge: number;

  constructor() {
    this.api = ky.create({
      prefixUrl: ARCHIVE_API_BASE,
      timeout: 30000,
      retry: {
        limit: MAX_RETRIES,
        delay: (attemptCount) => RETRY_DELAY_MS * Math.pow(2, attemptCount - 1),
      },
    });
    this.cache = new Map();
    this.cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours in-memory cache
  }

  /**
   * Fetch metadata for an Archive.org identifier
   */
  async fetchMetadata(
    identifier: string,
    options: FetchOptions = {}
  ): Promise<ArchiveMetadata> {
    // Check in-memory cache first
    const cached = this.cache.get(identifier);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.data;
    }

    try {
      const response = await this.api
        .get(`metadata/${identifier}`, {
          signal: options.signal,
          timeout: options.timeout || 30000,
        })
        .json<ArchiveMetadata>();

      // Validate response
      if (!response.metadata || !response.files) {
        throw new Error(`Invalid metadata response for ${identifier}`);
      }

      // Cache the result
      this.cache.set(identifier, {
        data: response,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request was cancelled');
        }
        if (error.name === 'TimeoutError') {
          throw new Error(`Timeout fetching metadata for ${identifier}`);
        }
        throw new Error(`Failed to fetch metadata for ${identifier}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract audio files from metadata
   * Filters and sorts by preferred format
   */
  extractAudioFiles(metadata: ArchiveMetadata): ArchiveFile[] {
    const audioFiles = metadata.files.filter((file) => {
      // Check if it's an audio format we support
      return AUDIO_FORMATS.includes(file.format);
    });

    // Sort by track number if available, then by name
    audioFiles.sort((a, b) => {
      const trackA = parseInt(a.track || '0', 10);
      const trackB = parseInt(b.track || '0', 10);
      if (trackA !== trackB) return trackA - trackB;
      return a.name.localeCompare(b.name);
    });

    return audioFiles;
  }

  /**
   * Get the best audio format for a file
   * Prefers higher quality formats
   */
  getBestAudioFile(files: ArchiveFile[], baseName: string): ArchiveFile | undefined {
    // Find all versions of this file
    const fileBase = baseName.replace(/\.[^.]+$/, '');
    const versions = files.filter((f) => f.name.startsWith(fileBase));

    // Return highest quality version
    for (const format of AUDIO_FORMATS) {
      const match = versions.find((f) => f.format === format);
      if (match) return match;
    }

    return versions[0];
  }

  /**
   * Generate download URL for a file
   */
  getDownloadUrl(identifier: string, fileName: string): string {
    return `${ARCHIVE_API_BASE}${DOWNLOAD_ENDPOINT}/${identifier}/${encodeURIComponent(fileName)}`;
  }

  /**
   * Generate streaming URL with range support
   */
  getStreamUrl(identifier: string, fileName: string): string {
    // Archive.org supports range requests, use the same URL
    return this.getDownloadUrl(identifier, fileName);
  }

  /**
   * Fetch audio file with progress tracking
   */
  async fetchAudioWithProgress(
    identifier: string,
    fileName: string,
    onProgress?: (loaded: number, total: number) => void,
    signal?: AbortSignal
  ): Promise<Blob> {
    const url = this.getDownloadUrl(identifier, fileName);

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Failed to download ${fileName}: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (onProgress && total > 0) {
        onProgress(loaded, total);
      }
    }

    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    return blob;
  }

  /**
   * Parse duration string to seconds
   */
  parseDuration(duration: string | undefined): number {
    if (!duration) return 0;

    // Handle HH:MM:SS or MM:SS format
    const parts = duration.split(':').map((p) => parseInt(p, 10));

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }

    // Try parsing as float (seconds)
    const seconds = parseFloat(duration);
    return isNaN(seconds) ? 0 : Math.floor(seconds);
  }

  /**
   * Format duration in seconds to display string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Parse file size string to bytes
   */
  parseFileSize(size: string | undefined): number {
    if (!size) return 0;
    const num = parseFloat(size);
    return isNaN(num) ? 0 : Math.floor(num);
  }

  /**
   * Validate identifier format
   */
  isValidIdentifier(identifier: string): boolean {
    // Archive.org identifiers: alphanumeric, underscores, hyphens, periods
    return /^[a-zA-Z0-9_.-]+$/.test(identifier);
  }

  /**
   * Check if identifier exists on Archive.org
   */
  async checkIdentifierExists(identifier: string): Promise<boolean> {
    try {
      const response = await this.api.head(`metadata/${identifier}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get artwork URL for collection
   */
  getArtworkUrl(identifier: string): string {
    return `${ARCHIVE_API_BASE}/services/img/${identifier}`;
  }

  /**
   * Clear in-memory cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove specific item from cache
   */
  invalidateCache(identifier: string): void {
    this.cache.delete(identifier);
  }
}

// Export singleton instance
export const archiveFetcher = new ArchiveFetcher();

// Export class for testing
export { ArchiveFetcher };
