<script lang="ts">
  import { goto } from '$app/navigation';
  import { Icon, ProgressBar } from '$lib/components/ui';
  import {
    player,
    currentLecture,
    isPlaying,
    isLoading,
    progress,
    playbackRate,
    PLAYBACK_RATES,
  } from '$lib/stores/player';
  import { tr } from '$lib/services/language-engine';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';

  function handleClick() {
    if ($currentLecture) {
      goto(`/lecture/${encodeURIComponent($currentLecture.id)}`);
    }
  }

  function handleTogglePlay(e: MouseEvent) {
    e.stopPropagation();
    player.toggle();
  }

  function handleSkipBackward(e: MouseEvent) {
    e.stopPropagation();
    player.skipBackward(10);
  }

  function handleSkipForward(e: MouseEvent) {
    e.stopPropagation();
    player.skipForward(10);
  }

  function handleNext(e: MouseEvent) {
    e.stopPropagation();
    player.playNext();
  }

  function handleCycleSpeed(e: MouseEvent) {
    e.stopPropagation();
    player.cyclePlaybackRate();
  }

  function handleClose(e: MouseEvent) {
    e.stopPropagation();
    player.stop();
  }
</script>

{#if $currentLecture}
  <div
    class="fixed bottom-16 inset-x-0 z-40 bg-dark-surface/95 backdrop-blur-strong border-t border-dark-border mini-player-enter"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <!-- Progress bar on top -->
    <div class="absolute top-0 inset-x-0">
      <ProgressBar value={$progress} size="sm" />
    </div>

    <!-- Player content -->
    <div class="flex items-center gap-3 p-3 pt-4">
      <!-- Clickable area for navigation -->
      <button
        class="flex items-center gap-3 flex-1 min-w-0 text-start"
        onclick={handleClick}
        aria-label="Open full player"
      >
        <!-- Artwork -->
        <div class="w-12 h-12 rounded-lg bg-dark-border overflow-hidden flex-shrink-0">
          {#if $currentLecture.artwork}
            <img
              src={$currentLecture.artwork}
              alt=""
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full flex items-center justify-center">
              <Icon name="Music" size={20} class="text-text-secondary" />
            </div>
          {/if}
        </div>

        <!-- Title & Scholar -->
        <div class="flex-1 min-w-0">
          <p
            class="font-medium truncate"
            dir={metadataNormalizer.isRtlText($currentLecture.title) ? 'rtl' : 'ltr'}
          >
            {$currentLecture.title}
          </p>
          <p class="text-sm text-text-secondary truncate">
            {$currentLecture.contributor}
          </p>
        </div>
      </button>

      <!-- Controls -->
      <div class="flex items-center gap-0.5 flex-shrink-0">
        <!-- Skip Backward 10s -->
        <button
          onclick={handleSkipBackward}
          class="p-1.5 rounded-full hover:bg-dark-border transition-colors"
          aria-label={$tr('player.skipBackward')}
        >
          <Icon name="RotateCcw" size={18} />
        </button>

        <!-- Play/Pause -->
        <button
          onclick={handleTogglePlay}
          class="p-2 rounded-full hover:bg-dark-border transition-colors"
          aria-label={$isPlaying ? $tr('player.pause') : $tr('player.play')}
          disabled={$isLoading}
        >
          {#if $isLoading}
            <Icon name="Loader2" size={24} class="animate-spin" />
          {:else if $isPlaying}
            <Icon name="Pause" size={24} />
          {:else}
            <Icon name="Play" size={24} class="ms-0.5" />
          {/if}
        </button>

        <!-- Skip Forward 10s -->
        <button
          onclick={handleSkipForward}
          class="p-1.5 rounded-full hover:bg-dark-border transition-colors"
          aria-label={$tr('player.skipForward')}
        >
          <Icon name="RotateCw" size={18} />
        </button>

        <!-- Speed Control -->
        <button
          onclick={handleCycleSpeed}
          class="px-2 py-1 rounded-full hover:bg-dark-border transition-colors text-xs font-bold min-w-[40px]"
          aria-label={$tr('player.speed')}
        >
          {$playbackRate}x
        </button>

        <!-- Next -->
        <button
          onclick={handleNext}
          class="p-1.5 rounded-full hover:bg-dark-border transition-colors"
          aria-label={$tr('player.next')}
        >
          <Icon name="SkipForward" size={18} />
        </button>

        <!-- Close -->
        <button
          onclick={handleClose}
          class="p-1.5 rounded-full hover:bg-dark-border transition-colors"
          aria-label={$tr('common.close')}
        >
          <Icon name="X" size={18} />
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(html:not(.dark)) .bg-dark-surface\/95 {
    background-color: rgba(255, 255, 255, 0.95);
  }

  :global(html:not(.dark)) .border-dark-border {
    @apply border-gray-200;
  }

  :global(html:not(.dark)) .bg-dark-border {
    @apply bg-gray-200;
  }

  :global(html:not(.dark)) button:hover {
    @apply bg-gray-100;
  }
</style>
