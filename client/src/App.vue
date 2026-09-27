<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ChatWindow from './components/ChatWindow.vue'
import './styles/tokens.css'
import './styles/base.css'

const model = ref('')

onMounted(async () => {
  // The server is the single source of truth for which model answers.
  const res = await fetch('/api/health').catch(() => null)
  if (res?.ok) {
    const data = (await res.json().catch(() => null)) as { model?: string } | null
    model.value = data?.model ?? ''
  }
})
</script>

<template>
  <div class="app">
    <header class="app__header">
      <span class="app__logo">nechat</span>
      <span v-if="model" class="app__model" :title="model">{{ model }}</span>
    </header>
    <ChatWindow />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 820px;
  margin: 0 auto;
}

.app__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}

.app__logo {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.app__model {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .app__model {
    display: none;
  }
}
</style>
