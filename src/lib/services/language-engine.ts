/**
 * LanguageEngine Skill
 * Handles i18n, RTL/LTR switching, font loading, and locale-aware formatting
 * Supports English, Urdu, and Arabic
 */

import { writable, get, derived, type Readable, type Writable } from 'svelte/store';
import type { Language, Direction, LanguageConfig, Translations } from '$lib/types';
import { storageManager } from './storage-manager';
import { browser } from '$app/environment';

// Import translations statically for immediate availability
import enTranslations from '$lib/i18n/en.json';
import urTranslations from '$lib/i18n/ur.json';
import arTranslations from '$lib/i18n/ar.json';

// Language configurations
const LANGUAGES: Record<Language, LanguageConfig> = {
  en: {
    code: 'en',
    dir: 'ltr',
    font: 'Inter',
    name: 'English',
    nativeName: 'English',
  },
  ur: {
    code: 'ur',
    dir: 'rtl',
    font: 'Noto Nastaliq Urdu',
    name: 'Urdu',
    nativeName: 'اردو',
  },
  ar: {
    code: 'ar',
    dir: 'rtl',
    font: 'Amiri',
    name: 'Arabic',
    nativeName: 'العربية',
  },
};

// Pre-loaded translations map
const TRANSLATIONS: Map<Language, Translations> = new Map([
  ['en', enTranslations as Translations],
  ['ur', urTranslations as Translations],
  ['ar', arTranslations as Translations],
]);

// Default language
const DEFAULT_LANGUAGE: Language = 'en';

class LanguageEngine {
  private currentLanguage: Writable<Language>;
  private translationsStore: Writable<Translations>;
  private isInitialized = false;

  // Public stores
  public language: Readable<Language>;
  public direction: Readable<Direction>;
  public config: Readable<LanguageConfig>;
  public isRtl: Readable<boolean>;
  public translations: Readable<Translations>;

  constructor() {
    this.currentLanguage = writable<Language>(DEFAULT_LANGUAGE);
    this.translationsStore = writable<Translations>(TRANSLATIONS.get(DEFAULT_LANGUAGE)!);

    // Create derived stores
    this.language = this.currentLanguage;
    this.translations = this.translationsStore;
    this.direction = derived(this.currentLanguage, ($lang) => LANGUAGES[$lang].dir);
    this.config = derived(this.currentLanguage, ($lang) => LANGUAGES[$lang]);
    this.isRtl = derived(this.currentLanguage, ($lang) => LANGUAGES[$lang].dir === 'rtl');

    if (browser) {
      this.initialize();
    }
  }

  /**
   * Initialize language engine
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load saved language preference
    const settings = await storageManager.getSettings();
    if (settings.language) {
      await this.setLanguage(settings.language);
    } else {
      // Detect from browser
      const detected = this.detectBrowserLanguage();
      await this.setLanguage(detected);
    }

    this.isInitialized = true;
  }

  /**
   * Detect browser language preference
   */
  private detectBrowserLanguage(): Language {
    if (!browser) return DEFAULT_LANGUAGE;

    const browserLang = navigator.language.split('-')[0].toLowerCase();

    if (browserLang === 'ur') return 'ur';
    if (browserLang === 'ar') return 'ar';
    if (browserLang === 'en') return 'en';

    // Check if browser prefers RTL languages
    const rtlLanguages = ['ar', 'ur', 'fa', 'he', 'ps', 'sd'];
    for (const lang of navigator.languages) {
      const code = lang.split('-')[0].toLowerCase();
      if (rtlLanguages.includes(code)) {
        return code === 'ar' ? 'ar' : 'ur';
      }
    }

    return DEFAULT_LANGUAGE;
  }

  /**
   * Set current language
   */
  async setLanguage(lang: Language): Promise<void> {
    if (!LANGUAGES[lang]) return;

    this.currentLanguage.set(lang);
    this.translationsStore.set(TRANSLATIONS.get(lang)!);

    if (browser) {
      // Update HTML attributes
      document.documentElement.lang = lang;
      document.documentElement.dir = LANGUAGES[lang].dir;

      // Update CSS custom property for font
      document.documentElement.style.setProperty(
        '--font-primary',
        `'${LANGUAGES[lang].font}', ${LANGUAGES[lang].dir === 'rtl' ? 'serif' : 'sans-serif'}`
      );

      // Save preference
      const settings = await storageManager.getSettings();
      settings.language = lang;
      await storageManager.saveSettings(settings);
    }
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return get(this.currentLanguage);
  }

  /**
   * Get current direction
   */
  getDirection(): Direction {
    return LANGUAGES[get(this.currentLanguage)].dir;
  }

  /**
   * Get language config
   */
  getConfig(lang?: Language): LanguageConfig {
    return LANGUAGES[lang || get(this.currentLanguage)];
  }

  /**
   * Get all available languages
   */
  getAllLanguages(): LanguageConfig[] {
    return Object.values(LANGUAGES);
  }

  /**
   * Translate a key
   */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = get(this.currentLanguage);
    const translations = TRANSLATIONS.get(lang);

    if (!translations) return key;

    // Navigate nested keys (e.g., "player.play")
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Key not found, try English fallback
        const fallbackTranslations = TRANSLATIONS.get('en');
        if (fallbackTranslations) {
          value = fallbackTranslations;
          for (const ek of keys) {
            if (value && typeof value === 'object' && ek in value) {
              value = (value as Record<string, unknown>)[ek];
            } else {
              return key;
            }
          }
        } else {
          return key;
        }
        break;
      }
    }

    if (typeof value !== 'string') return key;

    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{${paramKey}}`);
      });
    }

    return value;
  }

  /**
   * Format number according to locale
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    const lang = get(this.currentLanguage);
    const locale = lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(num);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
    const lang = get(this.currentLanguage);
    const locale = lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar-SA' : 'en-US';
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date | number): string {
    const lang = get(this.currentLanguage);
    const locale = lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar-SA' : 'en-US';
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    const now = Date.now();
    const diff = now - dateObj.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    return rtf.format(-seconds, 'second');
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    // Use locale-specific numerals
    const formatNum = (n: number, pad = 2) =>
      this.formatNumber(n).padStart(pad, this.formatNumber(0));

    if (hours > 0) {
      return `${formatNum(hours, 1)}:${formatNum(minutes)}:${formatNum(secs)}`;
    }
    return `${formatNum(minutes, 1)}:${formatNum(secs)}`;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return this.formatNumber(0) + ' B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${this.formatNumber(parseFloat((bytes / Math.pow(k, i)).toFixed(1)))} ${units[i]}`;
  }

  /**
   * Get text alignment class based on direction
   */
  getTextAlign(): 'text-start' | 'text-end' {
    return 'text-start'; // CSS logical property handles RTL automatically
  }

  /**
   * Check if text contains RTL characters
   */
  isRtlText(text: string): boolean {
    const rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlPattern.test(text);
  }

  /**
   * Wrap text with appropriate bidi isolation
   */
  bidiIsolate(text: string): string {
    if (this.isRtlText(text) && this.getDirection() === 'ltr') {
      return `\u2067${text}\u2069`; // RLI...PDI
    }
    if (!this.isRtlText(text) && this.getDirection() === 'rtl') {
      return `\u2066${text}\u2069`; // LRI...PDI
    }
    return text;
  }
}

// Export singleton instance
export const languageEngine = new LanguageEngine();

// Export helper function for use in components (non-reactive)
export function t(key: string, params?: Record<string, string | number>): string {
  return languageEngine.t(key, params);
}

/**
 * Helper function to get translation value from translations object
 */
function getTranslation(
  translations: Translations,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: unknown = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Try English fallback
      const fallback = TRANSLATIONS.get('en');
      if (fallback) {
        value = fallback;
        for (const ek of keys) {
          if (value && typeof value === 'object' && ek in value) {
            value = (value as Record<string, unknown>)[ek];
          } else {
            return key;
          }
        }
      } else {
        return key;
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
      return String(params[paramKey] ?? `{${paramKey}}`);
    });
  }

  return value;
}

/**
 * Reactive translation store - use this in Svelte 5 components
 * Creates a derived store that returns a translation function
 * Usage in template: {$tr('key')} or {$tr('key', { param: 'value' })}
 */
export const tr = derived(
  languageEngine.translations,
  ($translations) => {
    return (key: string, params?: Record<string, string | number>): string => {
      return getTranslation($translations, key, params);
    };
  }
);

// Export class for testing
export { LanguageEngine, LANGUAGES };
