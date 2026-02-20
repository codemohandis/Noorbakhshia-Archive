/**
 * CollectionManager Service
 * Manages pre-configured Archive.org collection identifiers
 * Uses Archive.org metadata structure (album, creator, contributor, genre)
 */

import type { Collection, Genre, Album, CollectionConfig, AppConfig } from '$lib/types';
import configData from '$lib/config/collections.json';

class CollectionManager {
  private config: AppConfig;
  private collectionsMap: Map<string, CollectionConfig>;
  private genresMap: Map<string, Genre>;
  private albumsMap: Map<string, Album>;

  constructor() {
    this.config = configData as AppConfig;
    this.collectionsMap = new Map();
    this.genresMap = new Map();
    this.albumsMap = new Map();
    this.initialize();
  }

  private initialize(): void {
    // Index collections by identifier
    for (const collection of this.config.collections) {
      this.collectionsMap.set(collection.identifier, collection);
    }

    // Index genres by id
    for (const genre of this.config.genres || []) {
      this.genresMap.set(genre.id, genre);
    }

    // Index albums by id
    for (const album of this.config.albums || []) {
      this.albumsMap.set(album.id, album);
    }
  }

  /**
   * Get all configured collections
   */
  getAllCollections(): CollectionConfig[] {
    return this.config.collections;
  }

  /**
   * Get featured collections (for homepage)
   */
  getFeaturedCollections(): CollectionConfig[] {
    return this.config.collections.filter(c => c.featured);
  }

  /**
   * Get collection by identifier
   */
  getCollection(identifier: string): CollectionConfig | undefined {
    return this.collectionsMap.get(identifier);
  }

  /**
   * Get collections by album
   */
  getCollectionsByAlbum(albumName: string): CollectionConfig[] {
    return this.config.collections.filter(c => c.album === albumName);
  }

  /**
   * Get collections by genre
   */
  getCollectionsByGenre(genre: string): CollectionConfig[] {
    return this.config.collections.filter(c => c.genre === genre);
  }

  /**
   * Get all genres
   */
  getAllGenres(): Genre[] {
    return this.config.genres || [];
  }

  /**
   * Get genre by id
   */
  getGenre(id: string): Genre | undefined {
    return this.genresMap.get(id);
  }

  /**
   * Get all albums
   */
  getAllAlbums(): Album[] {
    return this.config.albums || [];
  }

  /**
   * Get album by id
   */
  getAlbum(id: string): Album | undefined {
    return this.albumsMap.get(id);
  }

  /**
   * Check if an identifier is in our configured list
   */
  isConfiguredCollection(identifier: string): boolean {
    return this.collectionsMap.has(identifier);
  }

  /**
   * Get collections by creator (book author)
   */
  getCollectionsByCreator(creator: string): CollectionConfig[] {
    return this.config.collections.filter(c => c.creator === creator);
  }

  /**
   * Get collections by contributor (lecturer)
   */
  getCollectionsByContributor(contributor: string): CollectionConfig[] {
    return this.config.collections.filter(c => c.contributor === contributor);
  }

  /**
   * Get unique creators (book authors)
   */
  getAllCreators(): string[] {
    const creators = new Set(this.config.collections.map(c => c.creator));
    return Array.from(creators);
  }

  /**
   * Get unique contributors (lecturers)
   */
  getAllContributors(): string[] {
    const contributors = new Set(this.config.collections.map(c => c.contributor));
    return Array.from(contributors);
  }

  /**
   * Get album statistics (collection count per album)
   * Returns map with album ID as key
   */
  getAlbumStats(): Map<string, number> {
    const stats = new Map<string, number>();

    // Count collections for each configured album
    for (const album of this.config.albums || []) {
      const count = this.config.collections.filter(c => c.album === album.nameEn).length;
      stats.set(album.id, count);
    }

    return stats;
  }

  /**
   * Search collections by name
   */
  searchCollections(query: string): CollectionConfig[] {
    const lowerQuery = query.toLowerCase();
    return this.config.collections.filter(
      c =>
        c.displayName.toLowerCase().includes(lowerQuery) ||
        c.title.toLowerCase().includes(lowerQuery) ||
        c.creator.toLowerCase().includes(lowerQuery) ||
        c.contributor.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Convert config to enriched Collection object
   * This is used after fetching metadata from Archive.org
   */
  enrichCollection(
    config: CollectionConfig,
    metadata?: {
      description?: string;
      totalLectures?: number;
      totalDuration?: number;
      artwork?: string;
    }
  ): Collection {
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
      description: metadata?.description,
      totalLectures: metadata?.totalLectures,
      totalDuration: metadata?.totalDuration,
      artwork: metadata?.artwork,
    };
  }

  // Legacy compatibility methods (map old names to new)

  /**
   * @deprecated Use getCollectionsByAlbum instead
   */
  getCollectionsByCategory(categoryId: string): CollectionConfig[] {
    return this.getCollectionsByAlbum(categoryId);
  }

  /**
   * @deprecated Use getAllAlbums instead
   */
  getAllCategories(): Album[] {
    return this.getAllAlbums();
  }

  /**
   * @deprecated Use getAlbumStats instead
   */
  getCategoryStats(): Map<string, number> {
    return this.getAlbumStats();
  }
}

// Export singleton instance
export const collectionManager = new CollectionManager();

// Export class for testing
export { CollectionManager };
