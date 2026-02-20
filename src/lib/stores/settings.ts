/**
 * Settings Store
 * Manages app settings with persistence
 */

import { writable, derived, get, type Readable } from 'svelte/store';
import type { Settings, Language, Theme } from '$lib/types';
import { storageManager, DEFAULT_SETTINGS } from '$lib/services/storage-manager';
import { languageEngine } from '$lib/services/language-engine';
import { browser } from '$app/environment';

function createSettingsStore() {
  const store = writable<Settings>(DEFAULT_SETTINGS);
  const { subscribe, update, set } = store;
  let initialized = false;

  return {
    subscribe,

    /**
     * Initialize settings from storage
     */
    async initialize(): Promise<void> {
      if (initialized) return;

      const savedSettings = await storageManager.getSettings();
      set(savedSettings);
      initialized = true;

      // Apply settings
      await this.applyTheme(savedSettings.theme);
      await languageEngine.setLanguage(savedSettings.language);
    },

    /**
     * Update a single setting
     */
    async updateSetting<K extends keyof Settings>(
      key: K,
      value: Settings[K]
    ): Promise<void> {
      update((s) => ({ ...s, [key]: value }));
      const settings = get(store);
      await storageManager.saveSettings(settings);

      // Handle side effects
      if (key === 'theme') {
        await this.applyTheme(value as Theme);
      } else if (key === 'language') {
        await languageEngine.setLanguage(value as Language);
      }
    },

    /**
     * Update multiple settings at once
     */
    async updateSettings(partial: Partial<Settings>): Promise<void> {
      update((s) => ({ ...s, ...partial }));
      const settings = get(store);
      await storageManager.saveSettings(settings);

      // Handle side effects
      if (partial.theme) {
        await this.applyTheme(partial.theme);
      }
      if (partial.language) {
        await languageEngine.setLanguage(partial.language);
      }
    },

    /**
     * Reset settings to defaults
     */
    async resetSettings(): Promise<void> {
      set(DEFAULT_SETTINGS);
      await storageManager.saveSettings(DEFAULT_SETTINGS);
      await this.applyTheme(DEFAULT_SETTINGS.theme);
      await languageEngine.setLanguage(DEFAULT_SETTINGS.language);
    },

    /**
     * Apply theme to document
     */
    async applyTheme(theme: Theme): Promise<void> {
      if (!browser) return;

      let isDark: boolean;

      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          const currentTheme = get(store).theme;
          if (currentTheme === 'system') {
            document.documentElement.classList.toggle('dark', e.matches);
            document.querySelector('meta[name="theme-color"]')?.setAttribute(
              'content',
              e.matches ? '#0D1117' : '#FAFBFC'
            );
          }
        });
      } else {
        isDark = theme === 'dark';
      }

      document.documentElement.classList.toggle('dark', isDark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content',
        isDark ? '#0D1117' : '#FAFBFC'
      );
    },

    /**
     * Get current settings
     */
    getSettings(): Settings {
      return get(store);
    },

    /**
     * Get a specific setting
     */
    getSetting<K extends keyof Settings>(key: K): Settings[K] {
      return get(store)[key];
    },
  };
}

// Create and export the settings store
export const settings = createSettingsStore();

// Derived stores for individual settings
export const language: Readable<Language> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.language
);

export const theme: Readable<Theme> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.theme
);

export const playbackSpeed: Readable<number> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.playbackSpeed
);

export const skipForward: Readable<number> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.skipForward
);

export const skipBackward: Readable<number> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.skipBackward
);

export const autoPlay: Readable<boolean> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.autoPlay
);

export const sleepTimer: Readable<number | null> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.sleepTimer
);

export const storageLimit: Readable<number> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.storageLimit
);

export const downloadQuality: Readable<Settings['downloadQuality']> = derived(
  { subscribe: settings.subscribe },
  ($settings) => $settings.downloadQuality
);

// Computed settings
export const isDarkTheme: Readable<boolean> = derived(
  theme,
  ($theme) => {
    if ($theme === 'system' && browser) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return $theme === 'dark';
  }
);
