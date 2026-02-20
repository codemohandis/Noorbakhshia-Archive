<script lang="ts">
  import { Header } from '$lib/components/layout';
  import { Card, Icon } from '$lib/components/ui';
  import { collectionManager } from '$lib/services/collection-manager';
  import { categoryEngine } from '$lib/services/category-engine';
  import { tr } from '$lib/services/language-engine';

  type TabId = 'categories' | 'downloaded';
  let activeTab = $state<TabId>('categories');

  const tabs: { id: TabId; label: string; icon: 'FolderOpen' | 'Download' }[] = [
    { id: 'categories', label: 'library.categories', icon: 'FolderOpen' },
    { id: 'downloaded', label: 'library.downloaded', icon: 'Download' },
  ];

  const categories = $derived(collectionManager.getAllCategories());
  const categoryStats = $derived(collectionManager.getCategoryStats());
</script>

<svelte:head>
  <title>{$tr('library.title')} - {$tr('app.name')}</title>
</svelte:head>

<Header title={$tr('library.title')} />

<div class="px-4 pb-8">
  <!-- Tabs -->
  <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
    {#each tabs as tab}
      <button
        onclick={() => activeTab = tab.id}
        class="tab-button flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-300
          {activeTab === tab.id ? 'tab-active' : 'tab-inactive'}"
      >
        <Icon name={tab.icon} size={18} />
        <span class="text-sm font-medium">{$tr(tab.label)}</span>
      </button>
    {/each}
  </div>

  <!-- Categories Tab -->
  {#if activeTab === 'categories'}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each categories as category}
        {@const theme = categoryEngine.getCategoryTheme(category.id)}
        {@const count = categoryStats.get(category.id) || 0}
        <a href="/category/{category.id}" class="block">
          <div
            class="category-card p-5 rounded-xl transition-all duration-300 hover:-translate-y-1"
            style="--accent-color: {theme.color}"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style="background-color: {theme.bgColor}"
              >
                <Icon name={theme.icon} size={28} style="color: {theme.color}" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg mb-1">{category.nameEn}</h3>
                <p class="text-text-secondary font-urdu text-base" dir="rtl">{category.name}</p>
                <p class="text-sm text-text-secondary mt-2 flex items-center gap-1">
                  <Icon name="BookOpen" size={14} />
                  {#if count > 1}
                    {$tr('collection.topics', { count })}
                  {:else if count === 1}
                    {$tr('collection.lecture')}
                  {:else}
                    {$tr('collection.noTopics')}
                  {/if}
                </p>
              </div>
              <Icon name="ChevronRight" size={20} class="text-text-secondary mt-2" />
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}

  <!-- Downloaded Tab -->
  {#if activeTab === 'downloaded'}
    <Card padding="lg" class="text-center">
      <Icon name="Download" size={48} class="mx-auto mb-4 text-text-secondary" />
      <p class="text-text-secondary">{$tr('library.noDownloads')}</p>
      <p class="text-sm text-text-secondary mt-2">
        {$tr('download.storageWarning')}
      </p>
    </Card>
  {/if}
</div>

<style>
  .tab-button {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .tab-active {
    background: rgba(255, 255, 255, 0.95);
    color: #1E6853;
    box-shadow: 0 4px 12px rgba(30, 104, 83, 0.3);
  }

  .tab-inactive {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  .tab-inactive:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  :global(html:not(.dark)) .tab-active {
    background: #1E6853;
    color: white;
  }

  :global(html:not(.dark)) .tab-inactive {
    background: rgba(30, 104, 83, 0.1);
    color: #1E6853;
  }

  :global(html:not(.dark)) .tab-inactive:hover {
    background: rgba(30, 104, 83, 0.2);
  }

  .category-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-left: 4px solid var(--accent-color);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .category-card:hover {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.15);
  }

  :global(html:not(.dark)) .category-card {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(30, 104, 83, 0.1);
    border-left: 4px solid var(--accent-color);
  }

  :global(html:not(.dark)) .category-card:hover {
    background: rgba(255, 255, 255, 0.95);
  }

  :global(html:not(.dark)) .bg-dark-surface {
    @apply bg-gray-100;
  }

  :global(html[dir="rtl"]) [data-icon="ChevronRight"] {
    transform: scaleX(-1);
  }

  .font-urdu {
    font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
  }
</style>
