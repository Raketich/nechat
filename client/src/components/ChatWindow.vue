<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useChat } from '../composables/useChat'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

const { messages, isStreaming, send, stop } = useChat()

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
    <MessageList :messages="messages" />
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
