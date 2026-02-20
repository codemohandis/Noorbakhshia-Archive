<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Header } from '$lib/components/layout';
  import { FullPlayer } from '$lib/components/player';
  import { Icon } from '$lib/components/ui';
  import { library } from '$lib/stores/library';
  import { player, currentLecture } from '$lib/stores/player';
  import { tr } from '$lib/services/language-engine';
  import type { Lecture } from '$lib/types';

  const lectureId = $derived(decodeURIComponent($page.params.id || ''));

  let lecture = $state<Lecture | undefined>();
  let isLoading = $state(true);

  onMount(async () => {
    lecture = await library.getLecture(lectureId);
    isLoading = false;

    // If no current lecture playing, start this one
    if (lecture && !$currentLecture) {
      await player.play(lecture);
    } else if (lecture && $currentLecture?.id !== lecture.id) {
      // Different lecture, switch to it
      await player.play(lecture);
    }
  });

  function handleBack() {
    // Go back to collection if we know it
    if (lecture?.collectionId) {
      goto(`/collection/${lecture.collectionId}`);
    } else {
      goto('/library');
    }
  }
</script>

<svelte:head>
  <title>{$currentLecture?.title || $tr('player.nowPlaying')} - {$tr('app.name')}</title>
</svelte:head>

<div class="fixed inset-0 z-50 bg-dark-bg">
  <!-- Header -->
  <div class="absolute top-0 inset-x-0 z-10">
    <header class="flex items-center justify-between px-4 h-14">
      <button
        onclick={handleBack}
        class="p-2 -ms-2 rounded-full hover:bg-dark-surface/50 transition-colors"
        aria-label={$tr('common.back')}
      >
        <Icon name="ChevronLeft" size={24} />
      </button>

      <div class="text-center">
        <p class="text-xs text-text-secondary uppercase tracking-wider">
          {$tr('lecture.nowPlaying')}
        </p>
      </div>

      <button class="p-2 rounded-full hover:bg-dark-surface/50 transition-colors">
        <Icon name="MoreVertical" size={20} />
      </button>
    </header>
  </div>

  <!-- Player -->
  <div class="h-full pt-14">
    <FullPlayer />
  </div>
</div>

<style>
  :global(html:not(.dark)) .bg-dark-bg {
    @apply bg-light-bg;
  }

  :global(html[dir="rtl"]) button:first-child {
    transform: scaleX(-1);
  }
</style>
