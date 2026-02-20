<script lang="ts">
  import * as icons from 'lucide-svelte';

  interface Props {
    name: keyof typeof icons;
    size?: number;
    strokeWidth?: number;
    class?: string;
  }

  let {
    name,
    size = 24,
    strokeWidth = 2,
    class: className = '',
  }: Props = $props();

  const IconComponent = $derived(icons[name]);
</script>

{#if IconComponent}
  <IconComponent {size} {strokeWidth} class={className} />
{:else}
  <span class="inline-block" style="width: {size}px; height: {size}px;"></span>
{/if}
