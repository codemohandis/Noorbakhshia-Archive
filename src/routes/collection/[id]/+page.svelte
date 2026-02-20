<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Header } from '$lib/components/layout';
  import { Card, Icon, Button, Skeleton } from '$lib/components/ui';
  import { LectureItem } from '$lib/components/library';
  import { library } from '$lib/stores/library';
  import { player } from '$lib/stores/player';
  import { downloads } from '$lib/stores/downloads';
  import { tr } from '$lib/services/language-engine';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';
  import { categoryEngine } from '$lib/services/category-engine';
  import type { Collection, Lecture } from '$lib/types';

  const collectionId = $derived($page.params.id);

  let collection = $state<Collection | undefined>();
  let lectures = $state<Lecture[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      collection = await library.getCollection(collectionId);
      lectures = await library.getLectures(collectionId);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load collection';
    } finally {
      isLoading = false;
    }
  });

  async function handlePlayAll() {
    if (lectures.length === 0) return;

    // Add all to queue
    for (const lecture of lectures.slice(1)) {
      player.addToQueue(lecture);
    }

    // Play first
    await player.play(lectures[0]);
  }

  async function handleDownloadAll() {
    await downloads.queueMultiple(lectures);
  }

  async function handlePlayLecture(lecture: Lecture) {
    await player.play(lecture);
  }

  const categoryTheme = $derived(
    collection ? categoryEngine.getCategoryTheme(collection.album) : null
  );
</script>

<svelte:head>
  <title>{collection?.title || $tr('common.loading')} - {$tr('app.name')}</title>
</svelte:head>

<Header showBack={true} />

{#if isLoading}
  <div class="px-4 pb-8">
    <!-- Hero skeleton -->
    <div class="flex gap-4 mb-6">
      <Skeleton variant="rectangular" width="120px" height="120px" class="rounded-xl" />
      <div class="flex-1">
        <Skeleton width="80%" height="24px" class="mb-2" />
        <Skeleton width="60%" height="18px" class="mb-4" />
        <Skeleton width="40%" height="16px" />
      </div>
    </div>

    <!-- Lectures skeleton -->
    <div class="space-y-3">
      {#each Array(8) as _}
        <div class="flex items-center gap-4 py-3">
          <Skeleton variant="circular" width="40px" height="40px" />
          <div class="flex-1">
            <Skeleton width="70%" height="18px" class="mb-1" />
            <Skeleton width="30%" height="14px" />
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else if error}
  <div class="px-4 py-12 text-center">
    <Icon name="AlertCircle" size={48} class="mx-auto mb-4 text-red-500" />
    <p class="text-text-secondary mb-4">{error}</p>
    <Button onclick={() => location.reload()}>{$tr('errors.retry')}</Button>
  </div>
{:else if collection}
  <div class="px-4 pb-8">
    <!-- Collection Header -->
    <div class="flex gap-4 mb-6">
      <div class="w-28 h-28 rounded-xl bg-dark-surface overflow-hidden flex-shrink-0 shadow-lg">
        {#if collection.artwork}
          <img src={collection.artwork} alt="" class="w-full h-full object-cover" />
        {:else}
          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Icon name="Library" size={40} class="text-primary/50" />
          </div>
        {/if}
      </div>

      <div class="flex-1 min-w-0 py-1">
        <h1 class="text-xl font-bold line-clamp-2 mb-1">
          {collection.title}
        </h1>
        <p
          class="text-sm text-text-secondary mb-1"
          dir={metadataNormalizer.isRtlText(collection.displayName) ? 'rtl' : 'ltr'}
        >
          {collection.displayName}
        </p>
        <p class="text-sm text-text-secondary mb-3">{collection.contributor}</p>

        <div class="flex items-center gap-4 text-sm text-text-secondary">
          {#if collection.totalLectures}
            <span class="flex items-center gap-1">
              <Icon name="Headphones" size={16} />
              {collection.totalLectures}
            </span>
          {/if}
          {#if collection.totalDuration}
            <span class="flex items-center gap-1">
              <Icon name="Clock" size={16} />
              {metadataNormalizer.formatTotalDuration(collection.totalDuration)}
            </span>
          {/if}
          {#if categoryTheme}
            <span
              class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style="background-color: {categoryTheme.bgColor}; color: {categoryTheme.color}"
            >
              {collection.album}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 mb-6">
      <Button variant="primary" fullWidth onclick={handlePlayAll}>
        <Icon name="Play" size={18} />
        {$tr('collection.playAll')}
      </Button>
      <Button variant="outline" onclick={handleDownloadAll}>
        <Icon name="Download" size={18} />
      </Button>
    </div>

    <!-- Description -->
    {#if collection.description}
      <p class="text-sm text-text-secondary mb-6 line-clamp-3">
        {collection.description}
      </p>
    {/if}

    <!-- Lectures List -->
    <div class="space-y-1">
      {#each lectures as lecture, index (lecture.id)}
        <LectureItem
          {lecture}
          {index}
          onplay={() => handlePlayLecture(lecture)}
        />
      {/each}
    </div>
  </div>
{/if}

<style>
  :global(html:not(.dark)) .bg-dark-surface {
    @apply bg-gray-100;
  }
</style>
