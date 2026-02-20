<script lang="ts">
  import { Header } from '$lib/components/layout';
  import { Card, Icon, Button } from '$lib/components/ui';
  import {
    settings,
    language,
    theme,
  } from '$lib/stores/settings';
  import { downloads } from '$lib/stores/downloads';
  import { library } from '$lib/stores/library';
  import { tr, languageEngine } from '$lib/services/language-engine';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';
  import type { Language, Theme, StorageStats } from '$lib/types';
  import { onMount } from 'svelte';

  const themes: { value: Theme; label: string }[] = [
    { value: 'dark', label: 'settings.dark' },
    { value: 'light', label: 'settings.light' },
    { value: 'system', label: 'settings.system' },
  ];

  let storageStats = $state<StorageStats | null>(null);
  let showClearConfirm = $state(false);

  onMount(async () => {
    storageStats = await downloads.getStorageStats();
  });

  async function handleLanguageChange(lang: Language) {
    await settings.updateSetting('language', lang);
  }

  async function handleThemeChange(newTheme: Theme) {
    await settings.updateSetting('theme', newTheme);
  }

  async function handleClearCache() {
    await downloads.clearAll();
    storageStats = await downloads.getStorageStats();
    showClearConfirm = false;
  }

  async function handleClearAll() {
    await library.clearAll();
    await downloads.clearAll();
    storageStats = await downloads.getStorageStats();
    showClearConfirm = false;
  }

  function formatBytes(bytes: number): string {
    return metadataNormalizer.formatFileSize(bytes);
  }
</script>

<svelte:head>
  <title>{$tr('settings.title')} - {$tr('app.name')}</title>
</svelte:head>

<Header title={$tr('settings.title')} />

<div class="px-4 pb-8 space-y-6">
  <!-- Language Section -->
  <section>
    <h2 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
      {$tr('settings.language')}
    </h2>
    <Card padding="none">
      {#each languageEngine.getAllLanguages() as lang, index}
        <button
          onclick={() => handleLanguageChange(lang.code)}
          class="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-surface/50 transition-colors
            {index > 0 ? 'border-t border-dark-border' : ''}"
        >
          <div>
            <p class="font-medium">{lang.nativeName}</p>
            <p class="text-sm text-text-secondary">{lang.name}</p>
          </div>
          {#if $language === lang.code}
            <Icon name="Check" size={20} class="text-primary" />
          {/if}
        </button>
      {/each}
    </Card>
  </section>

  <!-- Theme Section -->
  <section>
    <h2 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
      {$tr('settings.theme')}
    </h2>
    <Card padding="none">
      <div class="flex">
        {#each themes as themeOption}
          <button
            onclick={() => handleThemeChange(themeOption.value)}
            class="flex-1 py-3 text-center transition-colors
              {$theme === themeOption.value ? 'bg-primary text-white' : 'hover:bg-dark-surface/50'}"
          >
            {$tr(themeOption.label)}
          </button>
        {/each}
      </div>
    </Card>
  </section>

  <!-- Storage Section -->
  <section>
    <h2 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
      {$tr('settings.storage')}
    </h2>
    <Card padding="md">
      {#if storageStats}
        <div class="flex items-center justify-between mb-4">
          <span>{$tr('settings.storageUsed')}</span>
          <span class="font-medium">
            {formatBytes(storageStats.used)} / {formatBytes(storageStats.quota)}
          </span>
        </div>

        <!-- Storage Bar -->
        <div class="h-2 bg-dark-border rounded-full overflow-hidden mb-4">
          <div
            class="h-full bg-primary transition-all"
            style="width: {storageStats.usedPercentage}%"
          ></div>
        </div>

        <div class="text-sm text-text-secondary space-y-1 mb-4">
          <div class="flex justify-between">
            <span>Audio files:</span>
            <span>{formatBytes(storageStats.audioSize)}</span>
          </div>
          <div class="flex justify-between">
            <span>Other cache:</span>
            <span>{formatBytes(storageStats.cacheSize)}</span>
          </div>
        </div>
      {/if}

      <div class="flex gap-3">
        <Button variant="outline" fullWidth onclick={() => showClearConfirm = true}>
          {$tr('settings.clearCache')}
        </Button>
      </div>
    </Card>
  </section>

  <!-- About Section -->
  <section>
    <h2 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
      {$tr('settings.about')}
    </h2>
    <Card padding="md">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Icon name="Headphones" size={32} class="text-white" />
        </div>
        <h3 class="text-lg font-bold mb-1">{$tr('app.name')}</h3>
        <p class="text-sm text-text-secondary mb-4">{$tr('app.tagline')}</p>
        <p class="text-xs text-text-secondary">
          {$tr('settings.version')} 1.0.0
        </p>
      </div>
    </Card>
  </section>
</div>

<!-- Clear Confirmation Modal -->
{#if showClearConfirm}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <Card padding="lg" class="max-w-sm w-full">
      <h3 class="text-lg font-semibold mb-2">{$tr('settings.clearCache')}</h3>
      <p class="text-text-secondary mb-6">
        This will remove all downloaded audio files and cached data.
      </p>
      <div class="flex gap-3">
        <Button variant="ghost" fullWidth onclick={() => showClearConfirm = false}>
          {$tr('common.cancel')}
        </Button>
        <Button variant="danger" fullWidth onclick={handleClearCache}>
          {$tr('common.confirm')}
        </Button>
      </div>
    </Card>
  </div>
{/if}

<style>
  :global(html:not(.dark)) .bg-dark-surface {
    @apply bg-gray-100;
  }

  :global(html:not(.dark)) .bg-dark-border {
    @apply bg-gray-200;
  }

  :global(html:not(.dark)) .border-dark-border {
    @apply border-gray-200;
  }
</style>
