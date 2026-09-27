<script setup lang="ts">
import { useChat } from '../composables/useChat'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

const { messages, isStreaming, send } = useChat()
</script>

<template>
  <main class="chat">
    <MessageList :messages="messages" />
    <ChatInput :disabled="isStreaming" @send="send" />
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
