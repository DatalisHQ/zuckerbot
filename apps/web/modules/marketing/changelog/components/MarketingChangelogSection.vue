<script setup lang="ts">
  import { formatDate, formatDistance, parseISO } from "date-fns";
  import type { ChangelogItem } from "../types";

  defineProps<{ items: ChangelogItem[] }>();
</script>

<template>
  <section id="changelog">
    <div class="mx-auto grid w-full max-w-xl grid-cols-1 gap-4 text-left">
      <div
        v-for="(item, i) of items"
        :key="i"
        class="rounded-sm bg-card/50 p-6"
      >
        <small
          className="inline-block rounded-full border border-highlight/50 px-2 py-0.5 text-xs font-semibold text-highlight"
          :title="formatDate(parseISO(item.date), 'yyyy-MM-dd')"
        >
          {{
            formatDistance(parseISO(item.date), new Date(), {
              addSuffix: true,
            })
          }}
        </small>
        <ul class="mt-4 list-disc space-y-2 pl-6">
          <li v-for="(change, j) of item.changes" :key="j">{{ change }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>
