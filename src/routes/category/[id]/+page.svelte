<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Header } from '$lib/components/layout';
  import { Card, Icon, Skeleton } from '$lib/components/ui';
  import { collections, isLibraryLoading } from '$lib/stores/library';
  import { collectionManager } from '$lib/services/collection-manager';
  import { categoryEngine } from '$lib/services/category-engine';
  import { tr } from '$lib/services/language-engine';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';

  const categoryId = $derived($page.params.id || '');

  // Get the album/category info
  const category = $derived(collectionManager.getAlbum(categoryId));

  // Filter collections by this category
  const categoryCollections = $derived(
    $collections.filter((c) => c.album === category?.nameEn)
  );

  const theme = $derived(categoryEngine.getCategoryTheme(categoryId));

  // Lazy loading state
  const ITEMS_PER_PAGE = 10;
  let visibleCount = $state(ITEMS_PER_PAGE);
  let loadMoreRef: HTMLDivElement | undefined = $state();
  let observer: IntersectionObserver | undefined;

  // Visible collections (lazy loaded)
  const visibleCollections = $derived(
    categoryCollections.slice(0, visibleCount)
  );

  const hasMore = $derived(visibleCount < categoryCollections.length);

  // Load more items when scrolling
  function loadMore() {
    if (hasMore) {
      visibleCount = Math.min(visibleCount + ITEMS_PER_PAGE, categoryCollections.length);
    }
  }

  // Reset visible count when category changes
  $effect(() => {
    categoryId;
    visibleCount = ITEMS_PER_PAGE;
  });

  onMount(() => {
    // Setup intersection observer for infinite scroll
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );

    return () => {
      observer?.disconnect();
    };
  });

  // Observe the load more trigger element
  $effect(() => {
    if (loadMoreRef && observer) {
      observer.observe(loadMoreRef);
      return () => observer?.unobserve(loadMoreRef!);
    }
  });
</script>

<svelte:head>
  <title>{category?.nameEn || $tr('common.loading')} - {$tr('app.name')}</title>
</svelte:head>

<Header showBack={true} />

<div class="px-4 pb-8">
  <!-- Category Header -->
  {#if category}
    <div class="category-header flex items-center gap-4 mb-6 p-4 rounded-xl">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
        style="background-color: {theme.bgColor}"
      >
        <Icon name={theme.icon} size={32} style="color: {theme.color}" />
      </div>
      <div>
        <h1 class="text-xl font-bold text-white">{category.nameEn}</h1>
        <p class="text-white/80 font-urdu" dir="rtl">{category.name}</p>
        <p class="text-sm text-white/60 mt-1">
          {$tr('collection.topics', { count: categoryCollections.length })}
        </p>
      </div>
    </div>
  {/if}

  <!-- Topics List -->
  {#if $isLibraryLoading}
    <div class="space-y-4">
      {#each Array(5) as _}
        <div class="skeleton-card p-4 rounded-xl">
          <div class="flex gap-4">
            <Skeleton variant="rectangular" width="64px" height="64px" class="rounded-lg" />
            <div class="flex-1">
              <Skeleton width="60%" height="20px" class="mb-2" />
              <Skeleton width="40%" height="16px" class="mb-3" />
              <Skeleton width="30%" height="14px" />
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else if categoryCollections.length > 0}
    <div class="space-y-3">
      {#each visibleCollections as collection, index}
        <a href="/collection/{collection.identifier}" class="block">
          <div class="collection-card p-4 rounded-xl transition-all duration-300 hover:-translate-y-1">
            <div class="flex gap-4">
              <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                {#if collection.artwork}
                  <img src={collection.artwork} alt="" class="w-full h-full object-cover" loading="lazy" />
                {:else}
                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Icon name="Library" size={24} class="text-primary/50" />
                  </div>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold truncate">
                  {collection.title}
                </h3>
                <p
                  class="text-sm text-text-secondary truncate font-urdu"
                  dir={metadataNormalizer.isRtlText(collection.displayName) ? 'rtl' : 'ltr'}
                >
                  {collection.displayName}
                </p>
                <div class="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                  {#if collection.totalLectures}
                    <span class="flex items-center gap-1">
                      <Icon name="Headphones" size={12} />
                      {$tr('collection.lectures', { count: collection.totalLectures })}
                    </span>
                  {/if}
                </div>
              </div>
              <Icon name="ChevronRight" size={20} class="text-text-secondary self-center" />
            </div>
          </div>
        </a>
      {/each}

      <!-- Load More Trigger -->
      {#if hasMore}
        <div bind:this={loadMoreRef} class="py-4 text-center">
          <div class="inline-flex items-center gap-2 text-sm text-white/60">
            <Icon name="Loader2" size={16} class="animate-spin" />
            <span>{$tr('common.loading')}</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Item Count -->
    <p class="text-center text-sm text-white/50 mt-4">
      {visibleCollections.length} / {categoryCollections.length}
    </p>
  {:else}
    <div class="empty-card p-8 rounded-xl text-center">
      <Icon name="FolderOpen" size={48} class="mx-auto mb-4 text-white/40" />
      <p class="text-white/60">{$tr('library.noCollectionsInCategory')}</p>
    </div>
  {/if}
</div>

<style>
  .category-header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .collection-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .collection-card:hover {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  }

  .skeleton-card {
    background: rgba(255, 255, 255, 0.05);
  }

  .empty-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .font-urdu {
    font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
  }

  :global(html:not(.dark)) .category-header {
    background: rgba(30, 104, 83, 0.9);
  }

  :global(html:not(.dark)) .collection-card {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(30, 104, 83, 0.1);
  }

  :global(html:not(.dark)) .collection-card:hover {
    background: rgba(255, 255, 255, 0.95);
  }

  :global(html:not(.dark)) .skeleton-card,
  :global(html:not(.dark)) .empty-card {
    background: rgba(255, 255, 255, 0.5);
  }

  :global(html:not(.dark)) .collection-card .text-text-secondary {
    color: #57606A;
  }

  :global(html[dir="rtl"]) [data-icon="ChevronRight"] {
    transform: scaleX(-1);
  }
</style>
