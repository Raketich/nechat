<script setup lang="ts">
import { ref, watch } from 'vue'
import { loadDraft, saveDraft } from '../history'
import { useI18n } from '../composables/useI18n'

defineProps<{ streaming: boolean }>()

const emit = defineEmits<{ send: [text: string]; stop: [] }>()

const { t } = useI18n()

// The unsent draft survives reloads alongside the history.
const draft = ref(loadDraft())
watch(draft, saveDraft)

function submit() {
  const text = draft.value
  if (!text.trim()) return
  emit('send', text)
  draft.value = ''
}

function onKeydown(event: KeyboardEvent) {
  // Enter sends; Shift+Enter makes a newline — the chat-convention split.
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <form class="input-bar" @submit.prevent="submit">
    <textarea
      v-model="draft"
      class="input-bar__field"
      rows="1"
      :placeholder="t('inputPlaceholder')"
      :aria-label="t('inputPlaceholder')"
      @keydown="onKeydown"
    />
    <!-- One slot, two roles: Send when idle, Stop while generating. The input
         stays editable during generation so the interface never locks up. -->
    <button
      v-if="streaming"
      type="button"
      class="input-bar__button input-bar__button--stop"
      @click="emit('stop')"
    >
      {{ t('stop') }}
    </button>
    <button v-else type="submit" class="input-bar__button">{{ t('send') }}</button>
  </form>
</template>

<style scoped>
.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.input-bar__field {
  flex: 1;
  min-height: 44px;
  max-height: 160px;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--border);
  background: var(--bg);
  line-height: 1.4;
}

.input-bar__button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: var(--radius-m);
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
  transition: background 0.15s ease;
}

.input-bar__button:hover {
  background: var(--accent-hover);
}

.input-bar__button--stop {
  background: var(--error);
  color: var(--error-surface);
}
</style>
