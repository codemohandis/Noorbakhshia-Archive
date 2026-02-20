// Core types for Dars-e-Noorbakhshia PWA

// Archive.org API types
export interface ArchiveMetadata {
  metadata: {
    identifier: string;
    title: string;
    creator?: string;
    description?: string;
    date?: string;
    language?: string;
    subject?: string | string[];
  };
  files: ArchiveFile[];
}

export interface ArchiveFile {
  name: string;
  format: string;
  size?: string;
  length?: string;
  title?: string;
  track?: string;
  source?: string;
}

// Normalized lecture types (matching Archive.org metadata structure)
export interface Collection {
  identifier: string;
  title: string;
  displayName: string;
  creator: string;
  contributor: string;
  album: string;
  genre: string;
  language: string;
  subject: string[];
  featured?: boolean;
  description?: string;
  totalLectures?: number;
  totalDuration?: number;
  artwork?: string;
}

export interface Lecture {
  id: string;
  collectionId: string;
  title: string;
  titleEn?: string;
  creator: string;
  contributor: string;
  album: string;
  duration: number;
  durationFormatted: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  track?: number;
  language?: string;
  description?: string;
  artwork?: string;
  downloadedAt?: number;
  isDownloaded?: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
  count?: number;
}

// Player types
export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
}

export interface QueueItem {
  lecture: Lecture;
  addedAt: number;
}

export interface PlayerState extends PlaybackState {
  currentLecture: Lecture | null;
  queue: QueueItem[];
  queueIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  shuffleEnabled: boolean;
}

// Progress and storage types
export interface PlaybackProgress {
  lectureId: string;
  position: number;
  duration: number;
  progress: number;
  lastPlayed: number;
  completed: boolean;
}

export interface Bookmark {
  id: string;
  lectureId: string;
  position: number;
  note?: string;
  createdAt: number;
}

export interface DownloadTask {
  lectureId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

// Settings types
export type Language = 'en' | 'ur' | 'ar';
export type Theme = 'dark' | 'light' | 'system';

export interface Settings {
  language: Language;
  theme: Theme;
  playbackSpeed: number;
  skipForward: number;
  skipBackward: number;
  autoPlay: boolean;
  sleepTimer: number | null;
  storageLimit: number;
  downloadQuality: 'high' | 'medium' | 'low';
}

// Storage quota types
export interface StorageStats {
  used: number;
  available: number;
  quota: number;
  usedPercentage: number;
  audioSize: number;
  cacheSize: number;
}

// Admin config types (matching Archive.org metadata structure)
export interface CollectionConfig {
  identifier: string;
  title: string;
  displayName: string;
  creator: string;
  contributor: string;
  album: string;
  genre: string;
  language: string;
  subject: string[];
  featured?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
}

export interface Album {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
}

export interface AppConfig {
  collections: CollectionConfig[];
  genres: Genre[];
  albums: Album[];
}

// i18n types
export interface Translations {
  [key: string]: string | Translations;
}

// Utility types
export type Direction = 'ltr' | 'rtl';

export interface LanguageConfig {
  code: Language;
  dir: Direction;
  font: string;
  name: string;
  nativeName: string;
}
