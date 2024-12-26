<script setup lang="ts">
  defineProps<{
    items: TableOfContentsItem[];
  }>();

  const scrollToSection = (id: string) => {
    const scrollOffset = 80;
    const element = document.getElementById(id);
    if (element) {
      const elementPositionY =
        element.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top: elementPositionY, behavior: "smooth" });
      history.pushState({}, "", `#${id}`);
    }
  };

  onMounted(() => {
    if (location.hash) {
      scrollToSection(location.hash.substring(1));
    }
  });
</script>

<template>
  <div class="w-full max-w-64 self-start rounded-sm border p-4">
    <h3 class="mb-2 text-base font-semibold">On this page</h3>
    <nav class="list-none space-y-2">
      <MarketingContentTableOfContentsItem
        v-for="item of items"
        :key="item.id"
        :item="item"
        @select-item="scrollToSection"
      />
    </nav>
  </div>
</template>
