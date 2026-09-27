<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import type { UiMessage } from '../types'

const props = defineProps<{ message: UiMessage }>()

const { t } = useI18n()

const isUser = computed(() => props.message.role === 'user')
const isTyping = computed(
  () => props.message.status === 'streaming' && props.message.content.length === 0,
)
</script>

<template>
  <article class="bubble" :class="isUser ? 'bubble--user' : 'bubble--assistant'">
    <span class="bubble__author">{{ isUser ? t('you') : t('assistant') }}</span>
    <p v-if="isTyping" class="bubble__typing" role="status">
      {{ t('typing') }}<span class="bubble__dots" aria-hidden="true"><i /><i /><i /></span>
    </p>
    <p v-else-if="message.content" class="bubble__text">{{ message.content }}</p>
    <p v-if="message.status === 'error' && message.error" class="bubble__error" role="alert">
      ⚠ {{ message.error.message }}
    </p>
  </article>
</template>

<style scoped>
.bubble {
  max-width: min(78%, 560px);
  padding: 10px 14px;
  border-radius: var(--radius-m);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  align-self: flex-start;
}

.bubble--user {
  align-self: flex-end;
  background: var(--accent);
  border-color: transparent;
  color: var(--accent-contrast);
}

.bubble__author {
  display: block;
  font-size: 0.72rem;
  opacity: 0.65;
  margin-bottom: 2px;
}

.bubble__text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.bubble__typing {
  margin: 0;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.bubble--user .bubble__typing {
  color: inherit;
}

.bubble__dots {
  display: inline-flex;
  gap: 3px;
}

.bubble__dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  animation: bubble-bounce 1.2s infinite;
}

.bubble__dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.bubble__dots i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes bubble-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.bubble__error {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  background: var(--error-surface);
  color: var(--error);
  font-size: 0.85rem;
}
</style>
