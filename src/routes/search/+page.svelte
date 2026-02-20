<script lang="ts">
  import { Header } from '$lib/components/layout';
  import { Card, Icon } from '$lib/components/ui';
  import { library } from '$lib/stores/library';
  import { player } from '$lib/stores/player';
  import { tr } from '$lib/services/language-engine';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';
  import type { Lecture, Collection } from '$lib/types';

  let query = $state('');
  let lectureResults = $state<Lecture[]>([]);
  let collectionResults = $state<Collection[]>([]);
  let isSearching = $state(false);
  let hasSearched = $state(false);

  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    query = target.value;

    clearTimeout(debounceTimer);

    if (query.length < 2) {
      lectureResults = [];
      collectionResults = [];
      hasSearched = false;
      return;
    }

    isSearching = true;
    debounceTimer = setTimeout(async () => {
      const results = await library.searchAll(query);
      lectureResults = results.lectures;
      collectionResults = results.collections;
      isSearching = false;
      hasSearched = true;
    }, 300);
  }

  async function handlePlayLecture(lecture: Lecture) {
    await player.play(lecture);
  }

  function handleOpenCollection(collectionId: string) {
    window.location.href = `/collection/${collectionId}`;
  }

  function clearSearch() {
    query = '';
    lectureResults = [];
    collectionResults = [];
    hasSearched = false;
  }
</script>

<svelte:head>
  <title>{$tr('search.title')} - {$tr('app.name')}</title>
</svelte:head>

<Header title={$tr('search.title')} />

<div class="px-4 pb-8">
  <!-- Search Input -->
  <div class="relative mb-6">
    <Icon
      name="Search"
      size={20}
      class="absolute start-4 top-1/2 -translate-y-1/2 text-text-secondary"
    />
    <input
      type="search"
      value={query}
      oninput={handleInput}
      placeholder={$tr('search.placeholder')}
      class="w-full h-12 ps-12 pe-12 rounded-xl bg-dark-surface border border-dark-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors"
    />
    {#if query}
      <button
        onclick={clearSearch}
        class="absolute end-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dark-border transition-colors"
      >
        <Icon name="X" size={18} class="text-text-secondary" />
      </button>
    {/if}
  </div>

  <!-- Loading -->
  {#if isSearching}
    <div class="flex items-center justify-center py-12">
      <Icon name="Loader2" size={32} class="animate-spin text-primary" />
    </div>
  {:else if hasSearched && lectureResults.length === 0 && collectionResults.length === 0}
    <!-- No Results -->
    <div class="text-center py-12">
      <Icon name="SearchX" size={48} class="mx-auto mb-4 text-text-secondary" />
      <p class="text-text-secondary">{$tr('search.noResults')}</p>
    </div>
  {:else if lectureResults.length > 0 || collectionResults.length > 0}
    <!-- Results -->
    <div class="space-y-6">
      <!-- Collections Section -->
      {#if collectionResults.length > 0}
        <div>
          <h2 class="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <Icon name="Folder" size={16} />
            Collections ({collectionResults.length})
          </h2>
          <div class="space-y-2">
            {#each collectionResults as collection}
              <button
                onclick={() => handleOpenCollection(collection.id)}
                class="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-dark-surface transition-colors text-start"
              >
                <!-- Icon -->
                <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="FolderOpen" size={20} class="text-primary" />
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p
                    class="font-medium truncate"
                    dir={metadataNormalizer.isRtlText(collection.displayName || collection.title) ? 'rtl' : 'ltr'}
                  >
                    {collection.displayName || collection.title}
                  </p>
                  <p class="text-sm text-text-secondary truncate">
                    {collection.contributor || collection.creator || 'Unknown'}
                  </p>
                </div>

                <Icon name="ChevronRight" size={20} class="text-text-secondary flex-shrink-0" />
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Lectures Section -->
      {#if lectureResults.length > 0}
        <div>
          <h2 class="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <Icon name="Music" size={16} />
            Lectures ({lectureResults.length})
          </h2>
          <div class="space-y-2">
            {#each lectureResults as lecture}
              <button
                onclick={() => handlePlayLecture(lecture)}
                class="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-dark-surface transition-colors text-start"
              >
                <!-- Thumbnail -->
                <div class="w-12 h-12 rounded-lg bg-dark-border overflow-hidden flex-shrink-0">
                  {#if lecture.artwork}
                    <img src={lecture.artwork} alt="" class="w-full h-full object-cover" />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center">
                      <Icon name="Music" size={20} class="text-text-secondary" />
                    </div>
                  {/if}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p
                    class="font-medium truncate"
                    dir={metadataNormalizer.isRtlText(lecture.title) ? 'rtl' : 'ltr'}
                  >
                    {lecture.title}
                  </p>
                  <p class="text-sm text-text-secondary truncate">
                    {lecture.contributor} • {lecture.durationFormatted}
                  </p>
                </div>

                <Icon name="Play" size={20} class="text-text-secondary flex-shrink-0" />
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Initial State -->
    <div class="text-center py-12">
      <Icon name="Search" size={48} class="mx-auto mb-4 text-text-secondary opacity-50" />
      <p class="text-text-secondary">{$tr('search.placeholder')}</p>
    </div>
  {/if}
</div>

<style>
  :global(html:not(.dark)) input {
    @apply bg-gray-100 border-gray-200;
  }

  :global(html:not(.dark)) button:hover {
    @apply bg-gray-100;
  }

  :global(html:not(.dark)) .bg-dark-surface {
    @apply bg-gray-100;
  }

  :global(html:not(.dark)) .bg-dark-border {
    @apply bg-gray-200;
  }
</style>
