<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useChat } from '../composables/useChat'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import EmptyState from './EmptyState.vue'

const { messages, isStreaming, send, stop, retry } = useChat()

// Esc stops the generation from anywhere on the page (assignment requirement).
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isStreaming.value) {
    stop()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <main class="chat">
    <!-- The chat log is replaced by the empty state only before the first
         message; the input bar stays visible the whole time. -->
    <EmptyState v-if="messages.length === 0" @prompt="send" />
    <MessageList v-else :messages="messages" @retry="retry" />
    <ChatInput :streaming="isStreaming" @send="send" @stop="stop" />
  </main>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
</style>
