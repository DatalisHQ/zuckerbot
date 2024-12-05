<script setup lang="ts">
  const props = defineProps<{
    modelValue: string;
  }>();

  const emit = defineEmits(["update:modelValue", "submit"]);

  const textareaRef = ref<HTMLTextAreaElement | null>(null);

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
</script>

<template>
  <div class="relative grow font-sans">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      class="text-foreground placeholder:text-muted-foreground/60 min-h-12 w-full resize-none overflow-hidden rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base focus:border-gray-300 focus:outline-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
      placeholder="Reply to ZuckerBot..."
      rows="1"
    ></textarea>
    <div
      class="pointer-events-none absolute right-2 flex items-center pr-3 text-gray-400"
      style="bottom: 18px"
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
