<script lang="ts">
  interface Props {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    animated?: boolean;
    class?: string;
  }

  let {
    value = 0,
    max = 100,
    size = 'md',
    showLabel = false,
    animated = false,
    class: className = '',
  }: Props = $props();

  const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };
</script>

<div class="w-full {className}">
  <div
    class="w-full bg-dark-border rounded-full overflow-hidden {sizeClasses[size]}"
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
  >
    <div
      class="h-full bg-primary transition-all duration-300 rounded-full {animated ? 'animate-pulse' : ''}"
      style="width: {percentage}%"
    ></div>
  </div>
  {#if showLabel}
    <span class="text-xs text-text-secondary mt-1 block text-end">
      {Math.round(percentage)}%
    </span>
  {/if}
</div>

<style>
  :global(html:not(.dark)) div:has([role="progressbar"]) > [role="progressbar"] {
    @apply bg-gray-200;
  }
</style>
