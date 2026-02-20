<script lang="ts">
  import { page } from '$app/stores';
  import { Icon } from '$lib/components/ui';
  import { tr } from '$lib/services/language-engine';
  import { hasCurrentLecture } from '$lib/stores/player';

  interface NavItem {
    href: string;
    icon: 'Home' | 'Library' | 'Search' | 'Settings';
    label: string;
  }

  const navItems: NavItem[] = [
    { href: '/', icon: 'Home', label: 'nav.home' },
    { href: '/library', icon: 'Library', label: 'nav.library' },
    { href: '/search', icon: 'Search', label: 'nav.search' },
    { href: '/settings', icon: 'Settings', label: 'nav.settings' },
  ];

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }
</script>

<nav
  class="fixed bottom-0 inset-x-0 z-50 bg-dark-surface/95 backdrop-blur-strong border-t border-dark-border pb-safe"
  style="padding-bottom: max(env(safe-area-inset-bottom), 0.5rem);"
>
  <div class="flex items-center justify-around h-16">
    {#each navItems as item}
      {@const active = isActive(item.href, $page.url.pathname)}
      <a
        href={item.href}
        class="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors
          {active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}"
        aria-current={active ? 'page' : undefined}
      >
        <Icon name={item.icon} size={24} strokeWidth={active ? 2.5 : 2} />
        <span class="text-xs font-medium">{$tr(item.label)}</span>
      </a>
    {/each}
  </div>
</nav>

<!-- Spacer to prevent content from being hidden behind nav -->
<div
  class="h-[calc(64px+env(safe-area-inset-bottom))]"
  class:mb-[76px]={$hasCurrentLecture}
></div>

<style>
  :global(html:not(.dark)) nav {
    @apply bg-light-surface/95 border-gray-200;
  }
</style>
