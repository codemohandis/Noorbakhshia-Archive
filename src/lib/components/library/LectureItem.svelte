<script lang="ts">
  import { Icon, ProgressBar } from '$lib/components/ui';
  import { downloads, getDownloadStatus, getDownloadProgress } from '$lib/stores/downloads';
  import { metadataNormalizer } from '$lib/services/metadata-normalizer';
  import type { Lecture } from '$lib/types';

  interface Props {
    lecture: Lecture;
    index: number;
    onplay: () => void;
  }

  let { lecture, index, onplay }: Props = $props();

  // Create stores at top level of component
  const downloadStatus = getDownloadStatus(lecture.id);
  const downloadProgress = getDownloadProgress(lecture.id);

  async function handleDownload(e: MouseEvent) {
    e.stopPropagation();
    if ($downloadStatus === 'idle' || $downloadStatus === 'error') {
      await downloads.queue(lecture);
    }
  }
</script>

<div class="w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-dark-surface transition-colors">
  <!-- Track Number -->
  <div class="w-8 h-8 rounded-full bg-dark-surface flex items-center justify-center flex-shrink-0">
    <span class="text-sm font-medium text-text-secondary">
      {lecture.track || index + 1}
    </span>
  </div>

  <!-- Lecture Info (clickable for play) -->
  <button
    onclick={onplay}
    class="flex-1 min-w-0 text-start"
  >
    <p
      class="font-medium truncate"
      dir={metadataNormalizer.isRtlText(lecture.title) ? 'rtl' : 'ltr'}
    >
      {lecture.title}
    </p>
    <p class="text-sm text-text-secondary">
      {lecture.durationFormatted}
      {#if lecture.isDownloaded}
        <span class="text-primary ms-2">
          <Icon name="CheckCircle" size={14} class="inline" />
        </span>
      {/if}
    </p>

    <!-- Download Progress -->
    {#if $downloadStatus === 'downloading'}
      <div class="mt-1">
        <ProgressBar value={$downloadProgress} size="sm" />
      </div>
    {/if}
  </button>

  <!-- Download Button -->
  <button
    onclick={handleDownload}
    class="p-2 rounded-full hover:bg-primary/10 transition-colors flex-shrink-0"
    aria-label="Download"
    disabled={$downloadStatus === 'downloading' || $downloadStatus === 'completed' || lecture.isDownloaded}
  >
    {#if $downloadStatus === 'downloading'}
      <Icon name="Loader2" size={18} class="animate-spin text-primary" />
    {:else if $downloadStatus === 'completed' || lecture.isDownloaded}
      <Icon name="CheckCircle" size={18} class="text-primary" />
    {:else}
      <Icon name="Download" size={18} class="text-primary" />
    {/if}
  </button>

  <!-- Play Button -->
  <button
    onclick={onplay}
    class="p-2 rounded-full hover:bg-primary/10 transition-colors flex-shrink-0"
    aria-label="Play"
  >
    <Icon name="Play" size={20} class="text-primary" />
  </button>
</div>

<style>
  :global(html:not(.dark)) .bg-dark-surface {
    @apply bg-gray-100;
  }

  :global(html:not(.dark)) div:hover {
    @apply bg-gray-50;
  }
</style>
