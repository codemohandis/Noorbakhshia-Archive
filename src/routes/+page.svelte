<script lang="ts">
  import { onMount } from 'svelte';
  import { Header } from '$lib/components/layout';
  import { Card, Icon, Skeleton } from '$lib/components/ui';
  import { library, featuredCollections, isLibraryLoading } from '$lib/stores/library';
  import { player } from '$lib/stores/player';
  import { tr } from '$lib/services/language-engine';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';
  import type { Collection, Lecture, PlaybackProgress } from '$lib/types';

  let recentlyPlayed = $state<{ lecture: Lecture; progress: PlaybackProgress }[]>([]);

  onMount(async () => {
    recentlyPlayed = await library.getRecentlyPlayed();
  });

  async function handlePlayRecent(lecture: Lecture, progress: PlaybackProgress) {
    await player.play(lecture, progress.position);
  }

  function formatProgress(progress: PlaybackProgress): string {
    const percent = Math.round(progress.progress);
    return `${percent}%`;
  }
</script>

<svelte:head>
  <title>{$tr('app.name')}</title>
</svelte:head>

<div class="min-h-screen">
  <!-- Hero Section -->
  <div class="relative pt-6 pb-10 px-4">
    <div class="max-w-md mx-auto text-center">
      <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
        <Icon name="Headphones" size={40} class="text-white" />
      </div>
      <h1 class="text-3xl font-bold mb-2 text-white">{$tr('app.name')}</h1>
      <p class="text-white/80">{$tr('app.tagline')}</p>
    </div>
  </div>

  <div class="px-4 space-y-8 pb-8">
    <!-- Continue Listening -->
    {#if recentlyPlayed.length > 0}
      <section>
        <h2 class="text-lg font-semibold mb-4 text-white">{$tr('home.continueListening')}</h2>
        <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {#each recentlyPlayed as { lecture, progress }}
            <Card
              variant="interactive"
              padding="sm"
              class="flex-shrink-0 w-64"
              onclick={() => handlePlayRecent(lecture, progress)}
            >
              <div class="flex gap-3">
                <div class="w-14 h-14 rounded-lg bg-dark-border overflow-hidden flex-shrink-0">
                  {#if lecture.artwork}
                    <img src={lecture.artwork} alt="" class="w-full h-full object-cover" />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center">
                      <Icon name="Music" size={20} class="text-text-secondary" />
                    </div>
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <p
                    class="font-medium truncate text-sm"
                    dir={metadataNormalizer.isRtlText(lecture.title) ? 'rtl' : 'ltr'}
                  >
                    {lecture.title}
                  </p>
                  <p class="text-xs text-text-secondary truncate">{lecture.contributor}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="flex-1 h-1 bg-dark-border rounded-full overflow-hidden">
                      <div class="h-full bg-primary" style="width: {progress.progress}%"></div>
                    </div>
                    <span class="text-xs text-text-secondary">{formatProgress(progress)}</span>
                  </div>
                </div>
              </div>
            </Card>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Featured Collections -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">{$tr('home.featured')}</h2>
        <a href="/library" class="text-sm text-white/80 hover:text-white transition-colors">
          {$tr('home.browseAll')} →
        </a>
      </div>

      {#if $isLibraryLoading}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each Array(4) as _}
            <Card padding="md">
              <div class="flex gap-4">
                <Skeleton variant="rectangular" width="80px" height="80px" class="rounded-lg" />
                <div class="flex-1">
                  <Skeleton width="70%" height="20px" class="mb-2" />
                  <Skeleton width="50%" height="16px" class="mb-3" />
                  <Skeleton width="40%" height="14px" />
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {:else if $featuredCollections.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each $featuredCollections as collection}
            <a href="/collection/{collection.identifier}">
              <Card variant="interactive" padding="md">
                <div class="flex gap-4">
                  <div class="w-20 h-20 rounded-lg bg-dark-border overflow-hidden flex-shrink-0">
                    {#if collection.artwork}
                      <img
                        src={collection.artwork}
                        alt=""
                        class="w-full h-full object-cover"
                      />
                    {:else}
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <Icon name="Library" size={32} class="text-primary/50" />
                      </div>
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold truncate">
                      {collection.title}
                    </h3>
                    <p
                      class="text-sm text-text-secondary truncate"
                      dir={metadataNormalizer.isRtlText(collection.displayName) ? 'rtl' : 'ltr'}
                    >
                      {collection.displayName}
                    </p>
                    <div class="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                      {#if collection.totalLectures}
                        <span class="flex items-center gap-1">
                          <Icon name="Headphones" size={14} />
                          {collection.totalLectures}
                        </span>
                      {/if}
                      {#if collection.totalDuration}
                        <span class="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          {metadataNormalizer.formatTotalDuration(collection.totalDuration)}
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>
              </Card>
            </a>
          {/each}
        </div>
      {:else}
        <Card padding="lg" class="text-center">
          <Icon name="Library" size={48} class="mx-auto mb-4 text-text-secondary" />
          <p class="text-text-secondary">{$tr('library.noCollections')}</p>
        </Card>
      {/if}
    </section>
  </div>
</div>

<style>
  :global(html:not(.dark)) .text-white {
    @apply text-text-dark;
  }

  :global(html:not(.dark)) .text-white\/80 {
    @apply text-text-secondary;
  }

  :global(html:not(.dark)) .bg-white\/20 {
    @apply bg-primary/20;
  }
</style>
