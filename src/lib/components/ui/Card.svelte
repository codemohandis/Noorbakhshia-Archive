<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'interactive' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    href?: string;
  }

  let {
    variant = 'default',
    padding = 'md',
    href,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const baseClasses = 'rounded-xl border transition-all duration-200';

  const variantClasses = {
    default: 'bg-dark-surface border-dark-border',
    interactive: 'bg-dark-surface border-dark-border hover:border-primary/50 cursor-pointer active:scale-[0.99]',
    elevated: 'bg-dark-surface border-dark-border shadow-lg hover:shadow-xl',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const classes = $derived(
    `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`
  );
</script>

{#if href}
  <a {href} class={classes} {...rest}>
    {@render children?.()}
  </a>
{:else}
  <div class={classes} {...rest}>
    {@render children?.()}
  </div>
{/if}

<style>
  :global(html:not(.dark)) .bg-dark-surface {
    @apply bg-light-surface;
  }

  :global(html:not(.dark)) .border-dark-border {
    @apply border-gray-200;
  }
</style>
