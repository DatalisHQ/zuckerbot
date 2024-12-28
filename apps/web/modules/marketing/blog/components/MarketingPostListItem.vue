<script setup lang="ts">
  import type { MarketingBlogPageFields } from "@/modules/marketing/blog/types";

  const props = defineProps<{
    post: MarketingBlogPageFields;
  }>();

  const { formatDate } = useLocaleDate();

  const pagePath = computed(() => {
    return props.post._path || "";
  });
</script>

<template>
  <div class="rounded-sm border bg-card/50 p-6">
    <div
      v-if="props.post.image?.src"
      class="relative -m-4 mb-4 aspect-[16/9] overflow-hidden rounded-sm"
    >
      <NuxtImg
        :src="props.post.image.src"
        :alt="props.post.title"
        sizes="100vw md:50vw"
        width="1920"
        height="1080"
        class="h-full object-cover object-center"
      />

      <NuxtLinkLocale :to="pagePath" class="absolute inset-0" />
    </div>

    <div v-if="post.tags?.length" class="mb-2 flex flex-wrap gap-2">
      <span
        v-for="tag of post.tags"
        :key="tag"
        class="text-xs font-semibold uppercase tracking-wider text-primary"
      >
        #{{ tag }}
      </span>
    </div>

    <NuxtLinkLocale :to="pagePath" class="text-xl font-semibold">
      {{ props.post.title }}
    </NuxtLinkLocale>
    <p v-if="post.description" class="opacity-50">
      {{ post.description }}
    </p>

    <div class="mt-4 flex items-center justify-between">
      <div v-if="post.authorName" class="flex items-center">
        <div
          v-if="post.authorImage"
          class="relative mr-2 size-8 overflow-hidden rounded-full"
        >
          <NuxtImg
            :src="post.authorImage"
            :alt="post.authorName"
            sizes="96px"
            class="object-cover object-center"
          />
        </div>
        <div>
          <p class="text-sm font-semibold opacity-50">{{ post.authorName }}</p>
        </div>
      </div>

      <div v-if="post.date" class="ml-auto mr-0">
        <p class="text-sm opacity-30">
          {{ formatDate({ date: new Date(post.date) }) }}
        </p>
      </div>
    </div>
  </div>
</template>
