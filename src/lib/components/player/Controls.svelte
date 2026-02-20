<script lang="ts">
  import { Icon } from '$lib/components/ui';
  import {
    player,
    isPlaying,
    isLoading,
    isBuffering,
  } from '$lib/stores/player';
  import { skipForward, skipBackward } from '$lib/stores/settings';
  import { tr } from '$lib/services/language-engine';
</script>

<div class="flex items-center justify-center gap-6 px-6 py-4">
  <!-- Skip Backward -->
  <button
    onclick={() => player.skipBackward($skipBackward)}
    class="p-3 rounded-full hover:bg-dark-surface transition-colors"
    aria-label={$tr('player.skipBackward')}
  >
    <div class="relative">
      <Icon name="RotateCcw" size={28} />
      <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
        {$skipBackward}
      </span>
    </div>
  </button>

  <!-- Previous -->
  <button
    onclick={() => player.playPrevious()}
    class="p-3 rounded-full hover:bg-dark-surface transition-colors"
    aria-label={$tr('player.previous')}
  >
    <Icon name="SkipBack" size={28} />
  </button>

  <!-- Play/Pause -->
  <button
    onclick={() => player.toggle()}
    class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-colors active:scale-95"
    aria-label={$isPlaying ? $tr('player.pause') : $tr('player.play')}
    disabled={$isLoading}
  >
    {#if $isLoading || $isBuffering}
      <Icon name="Loader2" size={32} class="animate-spin" />
    {:else if $isPlaying}
      <Icon name="Pause" size={32} />
    {:else}
      <Icon name="Play" size={32} class="ms-1" />
    {/if}
  </button>

  <!-- Next -->
  <button
    onclick={() => player.playNext()}
    class="p-3 rounded-full hover:bg-dark-surface transition-colors"
    aria-label={$tr('player.next')}
  >
    <Icon name="SkipForward" size={28} />
  </button>

  <!-- Skip Forward -->
  <button
    onclick={() => player.skipForward($skipForward)}
    class="p-3 rounded-full hover:bg-dark-surface transition-colors"
    aria-label={$tr('player.skipForward')}
  >
    <div class="relative">
      <Icon name="RotateCw" size={28} />
      <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
        {$skipForward}
      </span>
    </div>
  </button>
</div>

<style>
  :global(html:not(.dark)) button:not(.bg-primary):hover {
    @apply bg-gray-100;
  }
</style>
