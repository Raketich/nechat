<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { UiMessage } from '../types'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{ messages: UiMessage[] }>()

const emit = defineEmits<{ retry: [] }>()

const scroller = ref<HTMLElement | null>(null)

// Simple follow-the-stream autoscroll: keep the newest content in view while
// the user stays near the bottom; never fight them if they scrolled up.
function isNearBottom(): boolean {
  const el = scroller.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

watch(
  () => props.messages.map((m) => `${m.id}:${m.content.length}:${m.status}`).join('|'),
  async () => {
    if (!isNearBottom()) return
    await nextTick()
    scroller.value?.scrollTo({ top: scroller.value.scrollHeight })
  },
)
</script>

<template>
  <!-- aria-live so screen readers announce incoming text; aria-busy while the model is generating -->
  <section
    ref="scroller"
    class="messages"
    aria-live="polite"
    :aria-busy="props.messages.some((m) => m.status === 'streaming')"
  >
    <MessageBubble v-for="m in props.messages" :key="m.id" :message="m" @retry="emit('retry')" />
  </section>
</template>

<style scoped>
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}
</style>
