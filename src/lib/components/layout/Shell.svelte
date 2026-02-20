<script lang="ts">
  import { onMount } from 'svelte';
  import Navigation from './Navigation.svelte';
  import MiniPlayer from '$lib/components/player/MiniPlayer.svelte';
  import { hasCurrentLecture } from '$lib/stores/player';
  import { library } from '$lib/stores/library';
  import { settings } from '$lib/stores/settings';

  let { children } = $props();

  onMount(async () => {
    // Initialize stores
    await settings.initialize();
    await library.initialize();
  });
</script>

<div class="min-h-screen bg-gradient-main text-text-primary">
  <main class="pb-16">
    {@render children?.()}
  </main>

  {#if $hasCurrentLecture}
    <MiniPlayer />
  {/if}

  <Navigation />
</div>

<style>
  :global(html:not(.dark)) .text-text-primary {
    @apply text-text-dark;
  }
</style>
