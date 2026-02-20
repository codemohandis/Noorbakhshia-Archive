/**
 * Player Store
 * Re-exports audio controller stores for easier access in components
 */

import { derived, type Readable } from 'svelte/store';
import { audioController, PLAYBACK_RATES } from '$lib/services/audio-controller';
import type { PlayerState, Lecture } from '$lib/types';

// Re-export the audio controller as the main player store
export const player = {
  subscribe: audioController.subscribe,

  // Playback controls
  play: (lecture: Lecture, startPosition?: number) => audioController.play(lecture, startPosition),
  pause: () => audioController.pause(),
  resume: () => audioController.resume(),
  toggle: () => audioController.toggle(),
  stop: () => audioController.stop(),

  // Seeking
  seek: (position: number) => audioController.seek(position),
  seekRelative: (seconds: number) => audioController.seekRelative(seconds),
  skipForward: (seconds?: number) => audioController.skipForward(seconds),
  skipBackward: (seconds?: number) => audioController.skipBackward(seconds),

  // Speed & volume
  setPlaybackRate: (rate: number) => audioController.setPlaybackRate(rate),
  cyclePlaybackRate: () => audioController.cyclePlaybackRate(),
  setVolume: (volume: number) => audioController.setVolume(volume),
  toggleMute: () => audioController.toggleMute(),

  // Queue management
  addToQueue: (lecture: Lecture) => audioController.addToQueue(lecture),
  removeFromQueue: (index: number) => audioController.removeFromQueue(index),
  clearQueue: () => audioController.clearQueue(),
  playNext: () => audioController.playNext(),
  playPrevious: () => audioController.playPrevious(),

  // Repeat & shuffle
  setRepeatMode: (mode: 'none' | 'one' | 'all') => audioController.setRepeatMode(mode),
  cycleRepeatMode: () => audioController.cycleRepeatMode(),
  toggleShuffle: () => audioController.toggleShuffle(),

  // Get current state
  getState: () => audioController.getState(),
};

// Individual derived stores for selective subscriptions
export const isPlaying: Readable<boolean> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.isPlaying
);

export const isPaused: Readable<boolean> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.isPaused
);

export const isLoading: Readable<boolean> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.isLoading
);

export const isBuffering: Readable<boolean> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.isBuffering
);

export const currentLecture: Readable<Lecture | null> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.currentLecture
);

export const currentTime: Readable<number> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.currentTime
);

export const duration: Readable<number> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.duration
);

export const progress: Readable<number> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.progress
);

export const playbackRate: Readable<number> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.playbackRate
);

export const volume: Readable<number> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.volume
);

export const isMuted: Readable<boolean> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.isMuted
);

export const queue: Readable<PlayerState['queue']> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.queue
);

export const repeatMode: Readable<PlayerState['repeatMode']> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.repeatMode
);

export const shuffleEnabled: Readable<boolean> = derived(
  { subscribe: audioController.subscribe },
  ($state) => $state.shuffleEnabled
);

// Helper derived stores
export const hasCurrentLecture: Readable<boolean> = derived(
  currentLecture,
  ($lecture) => $lecture !== null
);

export const formattedCurrentTime: Readable<string> = derived(
  currentTime,
  ($time) => formatTime($time)
);

export const formattedDuration: Readable<string> = derived(
  duration,
  ($duration) => formatTime($duration)
);

export const queueLength: Readable<number> = derived(
  queue,
  ($queue) => $queue.length
);

// Utility function
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Export playback rates constant
export { PLAYBACK_RATES };
