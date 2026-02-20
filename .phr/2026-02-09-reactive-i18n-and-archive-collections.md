# Prompt History Record (PHR)

## Metadata
- **ID**: PHR-0002
- **Date**: 2026-02-09
- **Project**: Dars-e-Noorbakhshia PWA
- **Type**: Bug Fix & Feature Enhancement
- **Stage**: green (implementation)
- **Duration**: ~30 minutes
- **Status**: Completed Successfully
- **Model**: claude-opus-4-5-20251101
- **Surface**: agent (Claude Code CLI)

## Prompt Summary
User requested to take screenshots of the running app, fix i18n translation issues (translations showing as keys instead of values), add 56 real Archive.org collection identifiers, and create a PHR for the work.

## Context
Continuation of PWA implementation session. The app was built but had:
1. Non-reactive translations - showing keys like `app.name` instead of translated text
2. Placeholder Archive.org identifiers instead of real ones
3. Various corrupted code from over-aggressive string replacements

## User's Original Request
```
here us the identifier """https://archive.org/metadata/00-almuqaddimah-lecture-series)
https://archive.org/metadata/01-babaltaharah-lecture-series)
... [56 total Archive.org identifiers for Noorbakhshia Fiqh lectures]
https://archive.org/metadata/aqaid-noorbakhshia-qa-series
https://archive.org/metadata/mustahab-prayers-lecture-series"""
```

## Response Summary
Fixed reactive i18n by creating a derived store `$tr()` for translations, added all 56 Archive.org identifiers to collections config, fixed multiple code corruptions from string replacements, and verified the app works with Urdu RTL layout.

## Approach Taken

### 1. Screenshot Testing
- Used Playwright to capture screenshots of the running app
- Discovered translations showing as keys (`app.name`, `nav.settings`)
- Identified that `t()` function was non-reactive in Svelte 5

### 2. Reactive Translation Fix
**Problem**: Static `t()` function called during render, before async translations loaded

**Solution**: Created reactive translation system:
```typescript
// New derived store for reactive translations
export const tr = derived(
  languageEngine.translations,
  ($translations) => {
    return (key: string, params?: Record<string, string | number>): string => {
      return getTranslation($translations, key, params);
    };
  }
);
```

Changed all components from `t('key')` to `$tr('key')` for reactive updates.

### 3. String Replacement Corruption Fixes
The `replace_all` operation for `t(` → `$tr(` accidentally corrupted:
- `:not(` → `:no$tr(` (CSS selectors)
- `onMount(` → `onMoun$tr(` (Svelte lifecycle)
- `isRtlText(` → `isRtlTex$tr(` (function names)

Fixed all 10+ affected files.

### 4. Archive.org Integration
Added 56 real collection identifiers covering:
- **54 Fiqh chapters** (Bab Al-Taharah through Bab Al-Hujub)
- **1 Aqeedah Q&A series**
- **1 Mustahab Prayers series**

Fixed typo: `34-babaljilah-lecture-series` → `34-babaljialah-lecture-series`

### 5. Verification
- Screenshot confirmed Urdu RTL layout working
- Title "درس نوربخشیہ" displaying correctly
- Navigation in Urdu: ترتیبات، تلاش، لائبریری، ہوم
- Build completing successfully

## Technical Decisions

### Why Derived Store for Translations?
Svelte 5's reactivity system requires store subscriptions (`$store`) for reactive updates. A simple function call like `t('key')` is evaluated once at render time and doesn't update when language changes.

### Static vs Dynamic Translation Loading
Changed from dynamic imports to static imports for translations:
```typescript
// Before (async, caused race condition)
const [en, ur, ar] = await Promise.all([
  import('$lib/i18n/en.json'),
  ...
]);

// After (sync, immediately available)
import enTranslations from '$lib/i18n/en.json';
import urTranslations from '$lib/i18n/ur.json';
import arTranslations from '$lib/i18n/ar.json';
```

## Files Modified

### Core Changes
- `src/lib/skills/language-engine.ts` - Added reactive `tr` store
- `src/lib/config/collections.json` - Added 56 real Archive.org identifiers

### Template Updates (t → $tr)
- `src/routes/+page.svelte`
- `src/routes/library/+page.svelte`
- `src/routes/search/+page.svelte`
- `src/routes/settings/+page.svelte`
- `src/routes/collection/[id]/+page.svelte`
- `src/routes/lecture/[id]/+page.svelte`
- `src/lib/components/layout/Header.svelte`
- `src/lib/components/layout/Navigation.svelte`
- `src/lib/components/player/MiniPlayer.svelte`
- `src/lib/components/player/FullPlayer.svelte`
- `src/lib/components/player/Controls.svelte`

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Non-reactive translations | Created derived `tr` store |
| CSS `:not()` selector corruption | Fixed `:no$tr(` → `:not(` in 10 files |
| `onMount` function corruption | Fixed `onMoun$tr(` → `onMount(` in 4 files |
| `isRtlText` function corruption | Fixed `isRtlTex$tr(` → `isRtlText(` in 6 files |
| Invalid Archive.org identifier | Fixed typo in item #34 |

## Failure Modes Observed
- **Global replace_all too aggressive**: Replaced `t(` in CSS selectors and function names
- **Archive.org identifier typo**: `babaljilah` vs `babaljialah`
- **Race condition**: Async translation loading caused initial render with keys

## Next Experiments to Improve
1. Use more targeted regex for replacements (e.g., `\bt\(` with word boundary)
2. Validate Archive.org identifiers against API before adding to config
3. Consider pre-validating translations at build time

## Outcome
- ✅ Reactive i18n working - language switching updates UI immediately
- ✅ RTL layout working - Urdu displays right-to-left correctly
- ✅ 56 real Archive.org collections configured
- ✅ App builds and runs successfully at http://localhost:5175
- ✅ Dark theme with proper Urdu typography

## Next Steps
1. Test audio playback from Archive.org collections
2. Test offline download functionality
3. Add PNG icons for broader PWA compatibility
4. Deploy to production (Vercel/Cloudflare Pages)

## Tags
`svelte5` `i18n` `rtl` `reactive-stores` `archive-org` `bug-fix` `pwa` `urdu` `arabic` `translations`
