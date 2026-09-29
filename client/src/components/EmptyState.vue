<script setup lang="ts">
import { useI18n } from '../composables/useI18n'

const emit = defineEmits<{ prompt: [text: string] }>()

const { t } = useI18n()
</script>

<template>
  <div class="empty">
    <h2 class="empty__title">{{ t('emptyTitle') }}</h2>
    <p class="empty__subtitle">{{ t('emptySubtitle') }}</p>
    <div class="empty__prompts">
      <button type="button" class="empty__chip" @click="emit('prompt', t('promptExample1'))">
        {{ t('promptExample1') }}
      </button>
      <button type="button" class="empty__chip" @click="emit('prompt', t('promptExample2'))">
        {{ t('promptExample2') }}
      </button>
      <button type="button" class="empty__chip" @click="emit('prompt', t('promptExample3'))">
        {{ t('promptExample3') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.empty {
  margin: auto;
  max-width: 480px;
  text-align: center;
  padding: 24px;
}

.empty__title {
  margin: 0 0 4px;
  font-size: 1.35rem;
}

.empty__subtitle {
  margin: 0 0 20px;
  color: var(--text-muted);
}

.empty__prompts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty__chip {
  padding: 10px 16px;
  border-radius: var(--radius-m);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.empty__chip:hover {
  background: var(--surface-2);
  border-color: var(--accent);
}
</style>
