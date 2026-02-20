<script lang="ts">
  import { derived } from 'svelte/store';
  import { Icon, Button } from '$lib/components/ui';
  import {
    player,
    currentLecture,
    isPlaying,
    isLoading,
    isBuffering,
    progress,
    currentTime,
    duration,
    formattedCurrentTime,
    formattedDuration,
    playbackRate,
    repeatMode,
    shuffleEnabled,
    PLAYBACK_RATES,
  } from '$lib/stores/player';
  import { downloads, allTasks } from '$lib/stores/downloads';
  import { library } from '$lib/stores/library';
  import { tr } from '$lib/services/language-engine';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';
  import Controls from './Controls.svelte';

  let isDragging = $state(false);
  let dragProgress = $state(0);
  let showSpeedMenu = $state(false);
  let progressBar: HTMLDivElement | undefined = $state();

  const displayProgress = $derived(isDragging ? dragProgress : $progress);

  // Get download status for current lecture using derived store
  const currentDownloadStatus = derived(
    [currentLecture, allTasks],
    ([$lecture, $tasks]) => {
      if (!$lecture) return null;
      const task = $tasks.find((t) => t.lectureId === $lecture.id);
      return task?.status || null;
    }
  );

  function handleProgressClick(e: MouseEvent) {
    if (!progressBar || !$duration) return;
    const rect = progressBar.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    const newTime = ($duration * percentage) / 100;
    player.seek(newTime);
  }

  function handleProgressDragStart(e: MouseEvent | TouchEvent) {
    isDragging = true;
    updateDragProgress(e);
  }

  function handleProgressDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    updateDragProgress(e);
  }

  function handleProgressDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    const newTime = ($duration * dragProgress) / 100;
    player.seek(newTime);
  }

  function updateDragProgress(e: MouseEvent | TouchEvent) {
    if (!progressBar) return;
    const rect = progressBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    dragProgress = percentage;
  }

  function handleProgressKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      player.seekRelative(-5);
    } else if (e.key === 'ArrowRight') {
      player.seekRelative(5);
    }
  }

  function handleSpeedChange(rate: number) {
    player.setPlaybackRate(rate);
    showSpeedMenu = false;
  }

  async function handleDownload() {
    if (!$currentLecture) return;
    await downloads.queue($currentLecture);
  }

  async function handleBookmark() {
    if (!$currentLecture) return;
    await library.addBookmark($currentLecture.id, $currentTime);
  }
</script>

<svelte:window
  onmousemove={handleProgressDragMove}
  onmouseup={handleProgressDragEnd}
  ontouchmove={handleProgressDragMove}
  ontouchend={handleProgressDragEnd}
/>

{#if $currentLecture}
  <div class="flex flex-col h-full bg-dark-bg">
    <!-- Artwork Section -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-sm aspect-square rounded-2xl bg-dark-surface overflow-hidden shadow-2xl">
        {#if $currentLecture.artwork}
          <img
            src={$currentLecture.artwork}
            alt=""
            class="w-full h-full object-cover"
          />
        {:else}
          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Icon name="Music" size={80} class="text-primary/50" />
          </div>
        {/if}
      </div>
    </div>

    <!-- Info Section -->
    <div class="px-6 pb-4 text-center">
      <h1
        class="text-xl font-semibold mb-1 line-clamp-2"
        dir={metadataNormalizer.isRtlText($currentLecture.title) ? 'rtl' : 'ltr'}
      >
        {$currentLecture.title}
      </h1>
      <p class="text-text-secondary">{$currentLecture.contributor}</p>
    </div>

    <!-- Progress Section -->
    <div class="px-6 pb-4">
      <!-- Progress Bar -->
      <div
        bind:this={progressBar}
        class="relative h-8 flex items-center cursor-pointer group"
        onclick={handleProgressClick}
        onmousedown={handleProgressDragStart}
        ontouchstart={handleProgressDragStart}
        onkeydown={handleProgressKeydown}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayProgress}
        aria-label="Playback progress - click or drag to seek"
        tabindex="0"
      >
        <div class="w-full h-1.5 bg-dark-border rounded-full overflow-hidden group-hover:h-2 transition-all">
          <div
            class="h-full bg-primary rounded-full relative"
            style="width: {displayProgress}%"
          >
            <!-- Thumb -->
            <div
              class="absolute end-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            ></div>
          </div>
        </div>
      </div>

      <!-- Time Labels -->
      <div class="flex justify-between text-xs text-text-secondary mt-1">
        <span class="cursor-pointer hover:text-text-primary transition-colors" title="Click on progress bar to seek">{$formattedCurrentTime}</span>
        <span>{$formattedDuration}</span>
      </div>
    </div>

    <!-- Controls Section -->
    <Controls />

    <!-- Actions Section -->
    <div class="flex items-center justify-center gap-6 px-6 py-4">
      <!-- Speed -->
      <div class="relative">
        <button
          onclick={() => showSpeedMenu = !showSpeedMenu}
          class="p-2 rounded-full hover:bg-dark-surface transition-colors"
          aria-label={$tr('player.speed')}
        >
          <span class="text-sm font-medium">{$playbackRate}x</span>
        </button>

        {#if showSpeedMenu}
          <div class="absolute bottom-full mb-2 start-1/2 -translate-x-1/2 bg-dark-surface rounded-lg shadow-xl border border-dark-border p-2 min-w-[100px]">
            {#each PLAYBACK_RATES as rate}
              <button
                onclick={() => handleSpeedChange(rate)}
                class="w-full text-start px-3 py-2 rounded hover:bg-dark-border transition-colors {$playbackRate === rate ? 'text-primary' : ''}"
              >
                {rate}x
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Download -->
      <button
        onclick={handleDownload}
        class="p-2 rounded-full hover:bg-dark-surface transition-colors"
        aria-label={$tr('lecture.download')}
        disabled={$currentDownloadStatus === 'completed' || $currentDownloadStatus === 'downloading'}
      >
        {#if $currentDownloadStatus === 'completed'}
          <Icon name="CheckCircle" size={24} class="text-primary" />
        {:else if $currentDownloadStatus === 'downloading'}
          <Icon name="Loader2" size={24} class="animate-spin" />
        {:else}
          <Icon name="Download" size={24} />
        {/if}
      </button>

      <!-- Bookmark -->
      <button
        onclick={handleBookmark}
        class="p-2 rounded-full hover:bg-dark-surface transition-colors"
        aria-label={$tr('lecture.bookmark')}
      >
        <Icon name="Bookmark" size={24} />
      </button>

      <!-- Repeat -->
      <button
        onclick={() => player.cycleRepeatMode()}
        class="p-2 rounded-full hover:bg-dark-surface transition-colors {$repeatMode !== 'none' ? 'text-primary' : ''}"
        aria-label={$tr('player.repeat')}
      >
        {#if $repeatMode === 'one'}
          <Icon name="Repeat1" size={24} />
        {:else}
          <Icon name="Repeat" size={24} />
        {/if}
      </button>

      <!-- Shuffle -->
      <button
        onclick={() => player.toggleShuffle()}
        class="p-2 rounded-full hover:bg-dark-surface transition-colors {$shuffleEnabled ? 'text-primary' : ''}"
        aria-label={$tr('player.shuffle')}
      >
        <Icon name="Shuffle" size={24} />
      </button>
    </div>

    <!-- Safe area bottom padding -->
    <div class="pb-safe"></div>
  </div>
{/if}

<style>
  :global(html:not(.dark)) .bg-dark-bg {
    @apply bg-light-bg;
  }

  :global(html:not(.dark)) .bg-dark-surface {
    @apply bg-light-surface;
  }

  :global(html:not(.dark)) .bg-dark-border {
    @apply bg-gray-200;
  }

  :global(html:not(.dark)) .border-dark-border {
    @apply border-gray-200;
  }
</style>
