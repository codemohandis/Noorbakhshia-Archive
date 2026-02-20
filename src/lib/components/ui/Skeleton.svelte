<script lang="ts">
  interface Props {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string;
    height?: string;
    class?: string;
  }

  let {
    variant = 'text',
    width,
    height,
    class: className = '',
  }: Props = $props();

  const baseClasses = 'bg-dark-border animate-pulse';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
</script>

<div
  class="{baseClasses} {variantClasses[variant]} {className}"
  style:width={width}
  style:height={height}
  aria-hidden="true"
></div>

<style>
  :global(html:not(.dark)) .bg-dark-border {
    @apply bg-gray-200;
  }
</style>
