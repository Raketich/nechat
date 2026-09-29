<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { renderMarkdown } from '../markdown'
import { errorKeyFor } from '../errors'
import type { UiMessage } from '../types'

const props = defineProps<{ message: UiMessage }>()

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()

const isUser = computed(() => props.message.role === 'user')
const isTyping = computed(
  () => props.message.status === 'streaming' && props.message.content.length === 0,
)

// Assistant replies arrive as markdown (streaming included); user input stays
// plain text. renderMarkdown escapes HTML and sanitizes the output.
const renderedContent = computed(() =>
  isUser.value ? null : renderMarkdown(props.message.content),
)

// Human wording per failure class; raw upstream text stays in the title
// attribute for the curious, not in the user's face.
const errorKey = computed(() => errorKeyFor(props.message.error?.code))
</script>

<template>
  <article class="bubble" :class="isUser ? 'bubble--user' : 'bubble--assistant'">
    <span class="bubble__author">{{ isUser ? t('you') : t('assistant') }}</span>
    <p v-if="isTyping" class="bubble__typing" role="status">
      {{ t('typing') }}<span class="bubble__dots" aria-hidden="true"><i /><i /><i /></span>
    </p>
    <!-- eslint-disable-next-line vue/no-v-html — content is sanitized in renderMarkdown -->
    <div v-else-if="!isUser && renderedContent" class="bubble__md" v-html="renderedContent" />
    <p v-else-if="message.content" class="bubble__text">{{ message.content }}</p>
    <p v-if="message.status === 'stopped'" class="bubble__stopped">— {{ t('stoppedNote') }}</p>
    <div v-if="message.status === 'error' && message.error" class="bubble__error" role="alert">
      <p class="bubble__error-text">
        {{ errorKey ? t(errorKey) : message.error.message }}
        <span v-if="message.error.partial"> {{ t('partialNote') }}.</span>
      </p>
      <button
        v-if="message.error.retriable"
        type="button"
        class="bubble__retry"
        :title="message.error.message"
        @click="emit('retry')"
      >
        ⟳ {{ t('retry') }}
      </button>
    </div>
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

.bubble__error-text {
  margin: 0;
}

.bubble__retry {
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-s);
  border: 1px solid currentColor;
  color: inherit;
  font-size: 0.85rem;
}

.bubble__retry:hover {
  background: rgb(127 127 127 / 0.15);
}

.bubble__stopped {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-style: italic;
}

/* Markdown output */
.bubble__md :deep(p) {
  margin: 0 0 8px;
}

.bubble__md :deep(p:last-child) {
  margin-bottom: 0;
}

.bubble__md :deep(ul),
.bubble__md :deep(ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}

.bubble__md :deep(code) {
  font-family: var(--mono);
  font-size: 0.85em;
  background: var(--surface-2);
  border-radius: 4px;
  padding: 1px 5px;
}

.bubble__md :deep(pre) {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  padding: 10px 12px;
  overflow-x: auto;
}

.bubble__md :deep(pre code) {
  background: none;
  padding: 0;
}

.bubble__md :deep(a) {
  color: var(--accent);
}

.bubble__md :deep(blockquote) {
  margin: 0 0 8px;
  padding-left: 12px;
  border-left: 3px solid var(--border);
  color: var(--text-muted);
}
</style>
