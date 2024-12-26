<script setup lang="ts">
import { PlusIcon } from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  expanded: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "submit"]);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const showMore = ref(false);
const dropdownRef = ref(null);

// Quick actions
const quickActions = [
  { id: 1, text: "I want to schedule posts" },
  { id: 2, text: "I want to create an ad" },
  { id: 3, text: "What are my best & least performing ad?" },
  { id: 4, text: "I want to see my scheduled posts" },
];
const visibleButtons = 2;

const handleQuickAction = (text: string) => {
  showMore.value = false;
  emit('update:modelValue', text);
  emit('submit');
};

const adjustHeight = async () => {
  await nextTick();
  if (textareaRef.value) {
    textareaRef.value.style.height = "auto";
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  }
};

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  adjustHeight();
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    if (e.shiftKey) {
      return;
    }
    e.preventDefault();
    if (props.modelValue.trim()) {
      emit("submit");
    }
  }
};

watch(() => props.modelValue, adjustHeight);

onMounted(adjustHeight);
onClickOutside(dropdownRef, () => {
  showMore.value = false;
});
</script>

<template>
  <div class="relative grow font-sans">
    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="action in quickActions.slice(0, visibleButtons)"
        :key="action.id"
        @click="handleQuickAction(action.text)"
        :disabled="disabled"
        class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ action.text }}
      </button>

      <div class="relative" ref="dropdownRef">
        <button
          @click="showMore = !showMore"
          :disabled="disabled"
          class="rounded-full border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          :class="{ 'bg-gray-50': showMore }"
        >
          <PlusIcon class="size-5" />
        </button>

        <!-- Changed from top-full to bottom-full and mt-2 to mb-2 -->
        <div
          v-if="showMore"
          class="absolute right-0 bottom-full z-50 mb-2 w-80 rounded-md border bg-white py-1 shadow-lg"
        >
          <button
            v-for="action in quickActions.slice(visibleButtons)"
            :key="action.id"
            @click="handleQuickAction(action.text)"
            class="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50"
          >
            {{ action.text }}
          </button>
        </div>
      </div>
    </div>

    <textarea
      ref="textareaRef"
      :value="modelValue"
      :disabled="disabled"
      @input="handleInput"
      @keydown="handleKeydown"
      class="text-foreground placeholder:text-muted-foreground/60 w-full resize-none overflow-hidden rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-base focus:border-gray-300 focus:outline-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
      :class="[expanded ? 'min-h-44' : 'min-h-12']"
      :placeholder="expanded ? 'Chat with Zuckerbot...' : 'Reply to ZuckerBot...'"
      rows="1"
    ></textarea>
    <div
      class="pointer-events-none absolute right-2 flex items-center pr-3 text-gray-400"
      :style="{ bottom: expanded ? '28px' : '18px' }"
    >
      Press ⮐ to send
    </div>
  </div>
</template>

<style scoped>
textarea {
  font-family: inherit;
}
</style>