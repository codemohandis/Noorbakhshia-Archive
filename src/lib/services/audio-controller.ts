/**
 * AudioController Skill
 * Manages audio playback with state machine logic
 * Handles play/pause, seek, speed control, resume position, and queue
 */

import { writable, get, derived, type Readable } from 'svelte/store';
import type { Lecture, PlayerState, QueueItem, PlaybackProgress } from '$lib/types';
import { storageManager } from './storage-manager';

// Playback rates available
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Progress save interval (ms)
const PROGRESS_SAVE_INTERVAL = 5000;

// Initial player state
const initialState: PlayerState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  progress: 0,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  currentLecture: null,
  queue: [],
  queueIndex: -1,
  repeatMode: 'none',
  shuffleEnabled: false,
};

class AudioController {
  private audio: HTMLAudioElement | null = null;
  private store = writable<PlayerState>(initialState);
  private progressSaveTimer: ReturnType<typeof setInterval> | null = null;
  private wakeLock: WakeLockSentinel | null = null;

  // Svelte store subscription
  public subscribe = this.store.subscribe;

  // Derived stores for common access patterns
  public isPlaying: Readable<boolean> = derived(this.store, ($s) => $s.isPlaying);
  public currentLecture: Readable<Lecture | null> = derived(this.store, ($s) => $s.currentLecture);
  public progress: Readable<number> = derived(this.store, ($s) => $s.progress);
  public currentTime: Readable<number> = derived(this.store, ($s) => $s.currentTime);
  public duration: Readable<number> = derived(this.store, ($s) => $s.duration);

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudio();
    }
  }

  /**
   * Initialize audio element with event listeners
   */
  private initializeAudio(): void {
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    // Event listeners
    this.audio.addEventListener('loadstart', () => this.updateState({ isLoading: true }));
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateState({
        duration: this.audio?.duration || 0,
        isLoading: false,
      });
    });
    this.audio.addEventListener('canplay', () => this.updateState({ isBuffering: false }));
    this.audio.addEventListener('waiting', () => this.updateState({ isBuffering: true }));
    this.audio.addEventListener('playing', () => {
      this.updateState({ isPlaying: true, isPaused: false, isBuffering: false });
      this.requestWakeLock();
    });
    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false, isPaused: true });
      this.releaseWakeLock();
    });
    this.audio.addEventListener('ended', () => this.handleEnded());
    this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audio.addEventListener('error', (e) => this.handleError(e));
    this.audio.addEventListener('volumechange', () => {
      this.updateState({
        volume: this.audio?.volume || 1,
        isMuted: this.audio?.muted || false,
      });
    });

    // Start progress save timer
    this.startProgressSaveTimer();
  }

  /**
   * Update player state
   */
  private updateState(partial: Partial<PlayerState>): void {
    this.store.update((state) => ({ ...state, ...partial }));
  }

  /**
   * Get current state
   */
  public getState(): PlayerState {
    return get(this.store);
  }

  /**
   * Load and play a lecture
   */
  async play(lecture: Lecture, startPosition?: number): Promise<void> {
    if (!this.audio) return;

    const state = this.getState();

    // If same lecture and we're just resuming
    if (state.currentLecture?.id === lecture.id && state.isPaused) {
      await this.resume();
      return;
    }

    this.updateState({
      currentLecture: lecture,
      isLoading: true,
      currentTime: 0,
      duration: 0,
      progress: 0,
    });

    // Check for cached audio
    const cachedBlob = await storageManager.getCachedAudio(lecture.id);
    if (cachedBlob) {
      this.audio.src = URL.createObjectURL(cachedBlob);
    } else {
      this.audio.src = lecture.fileUrl;
    }

    // Check for saved progress
    if (startPosition === undefined) {
      const savedProgress = await storageManager.getProgress(lecture.id);
      if (savedProgress && savedProgress.position > 10 && !savedProgress.completed) {
        startPosition = savedProgress.position;
      }
    }

    try {
      await this.audio.play();

      // Seek to start position after playback begins
      if (startPosition && startPosition > 0) {
        this.audio.currentTime = startPosition;
      }

      this.updateMediaSession(lecture);
    } catch (error) {
      console.error('Playback failed:', error);
      this.updateState({ isLoading: false, isPlaying: false });
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.saveProgress();
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (!this.audio) return;
    try {
      await this.audio.play();
    } catch (error) {
      console.error('Resume failed:', error);
    }
  }

  /**
   * Toggle play/pause
   */
  async toggle(): Promise<void> {
    const state = this.getState();
    if (state.isPlaying) {
      this.pause();
    } else if (state.currentLecture) {
      await this.resume();
    }
  }

  /**
   * Seek to position (seconds)
   */
  seek(position: number): void {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, Math.min(position, this.audio.duration));
  }

  /**
   * Seek relative (forward/backward by seconds)
   */
  seekRelative(seconds: number): void {
    if (!this.audio) return;
    this.seek(this.audio.currentTime + seconds);
  }

  /**
   * Skip forward (default 15 seconds)
   */
  skipForward(seconds = 15): void {
    this.seekRelative(seconds);
  }

  /**
   * Skip backward (default 15 seconds)
   */
  skipBackward(seconds = 15): void {
    this.seekRelative(-seconds);
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void {
    if (!this.audio) return;
    if (!PLAYBACK_RATES.includes(rate)) return;
    this.audio.playbackRate = rate;
    this.updateState({ playbackRate: rate });
  }

  /**
   * Cycle through playback rates
   */
  cyclePlaybackRate(): void {
    const state = this.getState();
    const currentIndex = PLAYBACK_RATES.indexOf(state.playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    this.setPlaybackRate(PLAYBACK_RATES[nextIndex]);
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    if (!this.audio) return;
    this.audio.muted = !this.audio.muted;
  }

  /**
   * Stop playback and clear current lecture
   */
  stop(): void {
    if (!this.audio) return;
    this.saveProgress();
    this.audio.pause();
    this.audio.src = '';
    this.updateState({
      ...initialState,
      queue: this.getState().queue,
      queueIndex: this.getState().queueIndex,
    });
    this.releaseWakeLock();
  }

  // ============ Queue Management ============

  /**
   * Add lecture to queue
   */
  addToQueue(lecture: Lecture): void {
    const state = this.getState();
    const queueItem: QueueItem = { lecture, addedAt: Date.now() };
    this.updateState({ queue: [...state.queue, queueItem] });
  }

  /**
   * Remove from queue
   */
  removeFromQueue(index: number): void {
    const state = this.getState();
    const newQueue = [...state.queue];
    newQueue.splice(index, 1);
    this.updateState({ queue: newQueue });
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.updateState({ queue: [], queueIndex: -1 });
  }

  /**
   * Play next in queue
   */
  async playNext(): Promise<void> {
    const state = this.getState();
    const nextIndex = state.queueIndex + 1;

    if (nextIndex < state.queue.length) {
      this.updateState({ queueIndex: nextIndex });
      await this.play(state.queue[nextIndex].lecture);
    } else if (state.repeatMode === 'all' && state.queue.length > 0) {
      this.updateState({ queueIndex: 0 });
      await this.play(state.queue[0].lecture);
    }
  }

  /**
   * Play previous in queue
   */
  async playPrevious(): Promise<void> {
    const state = this.getState();

    // If more than 3 seconds in, restart current
    if (this.audio && this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }

    const prevIndex = state.queueIndex - 1;
    if (prevIndex >= 0) {
      this.updateState({ queueIndex: prevIndex });
      await this.play(state.queue[prevIndex].lecture);
    }
  }

  /**
   * Set repeat mode
   */
  setRepeatMode(mode: 'none' | 'one' | 'all'): void {
    this.updateState({ repeatMode: mode });
    if (this.audio) {
      this.audio.loop = mode === 'one';
    }
  }

  /**
   * Cycle repeat mode
   */
  cycleRepeatMode(): void {
    const state = this.getState();
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    this.setRepeatMode(nextMode);
  }

  /**
   * Toggle shuffle
   */
  toggleShuffle(): void {
    const state = this.getState();
    this.updateState({ shuffleEnabled: !state.shuffleEnabled });
  }

  // ============ Private Handlers ============

  private handleTimeUpdate(): void {
    if (!this.audio) return;
    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    this.updateState({ currentTime, duration, progress });
    this.updateMediaSessionPositionState();
  }

  private async handleEnded(): Promise<void> {
    const state = this.getState();

    // Mark as completed
    if (state.currentLecture) {
      await storageManager.saveProgress({
        lectureId: state.currentLecture.id,
        position: state.duration,
        duration: state.duration,
        progress: 100,
        lastPlayed: Date.now(),
        completed: true,
      });
    }

    // Handle repeat/queue
    if (state.repeatMode === 'one') {
      this.seek(0);
      await this.resume();
    } else {
      await this.playNext();
    }
  }

  private handleError(e: Event): void {
    console.error('Audio error:', e);
    this.updateState({ isLoading: false, isBuffering: false });
  }

  // ============ Progress Persistence ============

  private startProgressSaveTimer(): void {
    this.progressSaveTimer = setInterval(() => {
      const state = this.getState();
      if (state.isPlaying && state.currentLecture) {
        this.saveProgress();
      }
    }, PROGRESS_SAVE_INTERVAL);
  }

  private async saveProgress(): Promise<void> {
    const state = this.getState();
    if (!state.currentLecture) return;

    await storageManager.saveProgress({
      lectureId: state.currentLecture.id,
      position: state.currentTime,
      duration: state.duration,
      progress: state.progress,
      lastPlayed: Date.now(),
      completed: state.progress >= 95,
    });
  }

  // ============ Media Session API ============

  private updateMediaSession(lecture: Lecture): void {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: lecture.title,
      artist: lecture.contributor,
      album: lecture.album,
      artwork: lecture.artwork
        ? [{ src: lecture.artwork, sizes: '512x512', type: 'image/png' }]
        : [],
    });

    navigator.mediaSession.setActionHandler('play', () => this.resume());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => this.skipBackward());
    navigator.mediaSession.setActionHandler('seekforward', () => this.skipForward());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime);
      }
    });
  }

  private updateMediaSessionPositionState(): void {
    if (!('mediaSession' in navigator)) return;
    if (!this.audio) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: this.audio.duration || 0,
        playbackRate: this.audio.playbackRate,
        position: this.audio.currentTime,
      });
    } catch {
      // Ignore errors (some browsers don't support this)
    }
  }

  // ============ Wake Lock ============

  private async requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) return;

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      // Wake lock request failed (e.g., low battery)
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  // ============ Cleanup ============

  destroy(): void {
    if (this.progressSaveTimer) {
      clearInterval(this.progressSaveTimer);
    }
    this.stop();
    this.releaseWakeLock();
  }
}

// Export singleton instance
export const audioController = new AudioController();

// Export constants
export { PLAYBACK_RATES };
