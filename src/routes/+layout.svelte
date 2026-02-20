<script lang="ts">
  import '../app.css';
  import { Shell } from '$lib/components/layout';
  import { pwaInfo } from 'virtual:pwa-info';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  {#if pwaInfo}
    <link rel="manifest" href={pwaInfo.webManifest.href} />
  {/if}
</svelte:head>

<Shell>
  {@render children?.()}
</Shell>
