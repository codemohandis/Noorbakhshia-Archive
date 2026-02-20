<script lang="ts">
  import { Icon } from '$lib/components/ui';
  import { tr } from '$lib/services/language-engine';
  import { settings, language } from '$lib/stores/settings';

  interface Props {
    title?: string;
    showBack?: boolean;
    transparent?: boolean;
    showLangToggle?: boolean;
    onBack?: () => void;
  }

  let {
    title,
    showBack = false,
    transparent = false,
    showLangToggle = true,
    onBack,
  }: Props = $props();

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      history.back();
    }
  }

  async function toggleLanguage() {
    const newLang = $language === 'en' ? 'ur' : 'en';
    await settings.updateSetting('language', newLang);
  }
</script>

<header
  class="sticky top-0 z-40 flex items-center gap-4 px-4 h-14
    {transparent ? 'bg-transparent' : 'header-glass'}"
>
  {#if showBack}
    <button
      onclick={handleBack}
      class="p-2 -ms-2 rounded-full hover:bg-white/10 transition-colors"
      aria-label={$tr('common.back')}
    >
      <Icon name="ChevronLeft" size={24} />
    </button>
  {:else}
    <!-- Logo/Brand -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
        <Icon name="Headphones" size={18} class="text-white" />
      </div>
      <span class="font-semibold text-white hidden sm:block">Dars-e-Noorbakhshia</span>
    </div>
  {/if}

  {#if title}
    <h1 class="text-lg font-semibold truncate flex-1 text-white">
      {title}
    </h1>
  {:else}
    <div class="flex-1"></div>
  {/if}

  <!-- Language Toggle -->
  {#if showLangToggle}
    <button
      onclick={toggleLanguage}
      class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium"
    >
      <Icon name="Globe" size={16} />
      <span>{$language === 'en' ? 'UR' : 'EN'}</span>
    </button>
  {/if}
</header>

<style>
  .header-glass {
    background: rgba(30, 104, 83, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  :global(html:not(.dark)) .header-glass {
    background: rgba(255, 255, 255, 0.8);
    border-bottom: 1px solid rgba(30, 104, 83, 0.1);
  }

  :global(html:not(.dark)) .header-glass h1,
  :global(html:not(.dark)) .header-glass span {
    @apply text-text-dark;
  }

  :global(html:not(.dark)) .header-glass button {
    @apply bg-primary/10 text-primary;
  }

  :global(html:not(.dark)) .header-glass button:hover {
    @apply bg-primary/20;
  }

  :global(html:not(.dark)) .header-glass .w-8 {
    @apply bg-primary/20;
  }

  :global(html:not(.dark)) .header-glass [data-icon] {
    @apply text-primary;
  }

  :global(html[dir="rtl"]) button [data-icon="ChevronLeft"] {
    transform: scaleX(-1);
  }
</style>
