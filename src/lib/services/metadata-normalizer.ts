/**
 * MetadataNormalizer Skill
 * Transforms raw Archive.org metadata into normalized lecture objects
 * Handles title cleaning, speaker detection, language detection
 */

import type {
  ArchiveMetadata,
  ArchiveFile,
  Collection,
  Lecture,
  CollectionConfig,
} from '$lib/types';
import { archiveFetcher } from './archive-fetcher';

// Common patterns for title cleaning
const TITLE_CLEANUP_PATTERNS = [
  /^\d+[-_.\s]+/, // Leading track numbers
  /[-_]\s*\d+\s*$/, // Trailing track numbers
  /\.(mp3|ogg|flac|wav)$/i, // File extensions
  /^\s+|\s+$/g, // Leading/trailing whitespace
];

// Urdu/Arabic script detection patterns
const URDU_ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Common language patterns
const LANGUAGE_PATTERNS: { pattern: RegExp; language: string }[] = [
  { pattern: /\b(urdu|اردو)\b/i, language: 'ur' },
  { pattern: /\b(arabic|العربية|عربی)\b/i, language: 'ar' },
  { pattern: /\b(english|انگریزی)\b/i, language: 'en' },
  { pattern: /\b(persian|farsi|فارسی)\b/i, language: 'fa' },
];

class MetadataNormalizer {
  /**
   * Normalize raw Archive.org metadata into a Collection object
   */
  normalizeCollection(
    metadata: ArchiveMetadata,
    config: CollectionConfig
  ): Collection {
    const audioFiles = archiveFetcher.extractAudioFiles(metadata);
    const totalDuration = this.calculateTotalDuration(audioFiles);

    return {
      identifier: config.identifier,
      title: config.title,
      displayName: config.displayName,
      creator: config.creator,
      contributor: config.contributor,
      album: config.album,
      genre: config.genre,
      language: config.language,
      subject: config.subject,
      featured: config.featured,
      description: this.cleanDescription(metadata.metadata.description),
      totalLectures: audioFiles.length,
      totalDuration,
      artwork: archiveFetcher.getArtworkUrl(config.identifier),
    };
  }

  /**
   * Convert Archive.org files to normalized Lecture objects
   */
  normalizeLectures(
    metadata: ArchiveMetadata,
    config: CollectionConfig
  ): Lecture[] {
    const audioFiles = archiveFetcher.extractAudioFiles(metadata);

    return audioFiles.map((file, index) => {
      const duration = archiveFetcher.parseDuration(file.length);

      return {
        id: this.generateLectureId(config.identifier, file.name),
        collectionId: config.identifier,
        title: this.cleanTitle(file.title || file.name, index + 1),
        titleEn: this.extractEnglishTitle(file.title || file.name),
        creator: config.creator,
        contributor: config.contributor,
        album: config.album,
        duration,
        durationFormatted: archiveFetcher.formatDuration(duration),
        fileUrl: archiveFetcher.getStreamUrl(config.identifier, file.name),
        fileName: file.name,
        fileSize: archiveFetcher.parseFileSize(file.size),
        track: this.extractTrackNumber(file),
        language: this.detectLanguage(file.title || file.name, metadata.metadata.language),
        description: undefined,
        artwork: archiveFetcher.getArtworkUrl(config.identifier),
      };
    });
  }

  /**
   * Generate a unique lecture ID
   */
  private generateLectureId(collectionId: string, fileName: string): string {
    // Create a deterministic ID from collection + file name
    const cleanName = fileName.replace(/\.[^.]+$/, '').toLowerCase();
    return `${collectionId}__${cleanName}`.replace(/[^a-z0-9_-]/gi, '_');
  }

  /**
   * Clean and format lecture title
   */
  private cleanTitle(rawTitle: string, fallbackTrack?: number): string {
    let title = rawTitle;

    // Apply cleanup patterns
    for (const pattern of TITLE_CLEANUP_PATTERNS) {
      title = title.replace(pattern, '');
    }

    // Replace underscores and dashes with spaces
    title = title.replace(/[_-]+/g, ' ');

    // Trim and collapse whitespace
    title = title.replace(/\s+/g, ' ').trim();

    // If title is empty or just numbers, use fallback
    if (!title || /^\d+$/.test(title)) {
      title = `Lecture ${fallbackTrack || 1}`;
    }

    return title;
  }

  /**
   * Extract English title if mixed-language
   */
  private extractEnglishTitle(title: string): string | undefined {
    // If title has both scripts, try to extract English part
    if (URDU_ARABIC_PATTERN.test(title)) {
      // Split by common delimiters
      const parts = title.split(/[-|–—]/);
      for (const part of parts) {
        const trimmed = part.trim();
        // If this part has no Urdu/Arabic, it might be English
        if (trimmed && !URDU_ARABIC_PATTERN.test(trimmed)) {
          return trimmed;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract track number from file metadata
   */
  private extractTrackNumber(file: ArchiveFile): number | undefined {
    // First, try the track field
    if (file.track) {
      const trackNum = parseInt(file.track, 10);
      if (!isNaN(trackNum)) return trackNum;
    }

    // Try extracting from filename
    const match = file.name.match(/^(\d{1,3})[-_.\s]/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return undefined;
  }

  /**
   * Detect content language
   */
  private detectLanguage(title: string, metadataLanguage?: string): string {
    // First check metadata language field
    if (metadataLanguage) {
      const lang = metadataLanguage.toLowerCase();
      if (lang.includes('urdu') || lang === 'ur') return 'ur';
      if (lang.includes('arabic') || lang === 'ar') return 'ar';
      if (lang.includes('english') || lang === 'en') return 'en';
    }

    // Check title for language hints
    for (const { pattern, language } of LANGUAGE_PATTERNS) {
      if (pattern.test(title)) {
        return language;
      }
    }

    // Detect by script
    if (URDU_ARABIC_PATTERN.test(title)) {
      // Assume Urdu for now (could be enhanced with more detection)
      return 'ur';
    }

    // Default to Urdu for this app's content
    return 'ur';
  }

  /**
   * Clean description text
   */
  private cleanDescription(description?: string): string | undefined {
    if (!description) return undefined;

    // Remove HTML tags
    let clean = description.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    clean = this.decodeHtmlEntities(clean);

    // Trim and collapse whitespace
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean || undefined;
  }

  /**
   * Decode common HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };

    return text.replace(
      /&(?:amp|lt|gt|quot|#39|nbsp);/g,
      (match) => entities[match] || match
    );
  }

  /**
   * Calculate total duration from audio files
   */
  private calculateTotalDuration(files: ArchiveFile[]): number {
    return files.reduce((total, file) => {
      return total + archiveFetcher.parseDuration(file.length);
    }, 0);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
  }

  /**
   * Format total duration for display (hours and minutes)
   */
  formatTotalDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  }

  /**
   * Check if title contains RTL characters
   */
  isRtlText(text: string): boolean {
    return URDU_ARABIC_PATTERN.test(text);
  }
}

// Export singleton instance
export const metadataNormalizer = new MetadataNormalizer();

// Export class for testing
export { MetadataNormalizer };
