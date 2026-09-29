<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ChatWindow from './components/ChatWindow.vue'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
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

const { lang, setLang, t } = useI18n()
const { theme, toggle } = useTheme()
</script>

<template>
  <div class="app">
    <header class="app__header">
      <span class="app__logo">nechat</span>
      <span v-if="model" class="app__model" :title="model">{{ model }}</span>
      <span class="app__spacer" />
      <button
        type="button"
        class="app__icon-btn"
        :aria-label="theme === 'dark' ? t('themeLight') : t('themeDark')"
        :title="theme === 'dark' ? t('themeLight') : t('themeDark')"
        @click="toggle"
      >
        {{ theme === 'dark' ? '☀' : '☾' }}
      </button>
      <button
        type="button"
        class="app__icon-btn app__lang"
        :aria-label="t('langLabel')"
        :title="t('langLabel')"
        @click="setLang(lang === 'ru' ? 'en' : 'ru')"
      >
        {{ lang === 'ru' ? 'RU' : 'EN' }}
      </button>
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
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
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

.app__spacer {
  flex: 1;
}

.app__icon-btn {
  min-width: 36px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 0.95rem;
  transition: background 0.15s ease;
}

.app__icon-btn:hover {
  background: var(--surface-2);
}

.app__lang {
  border-radius: 18px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0 10px;
}

@media (max-width: 480px) {
  .app__model {
    display: none;
  }

  .app__header {
    padding: 10px 14px;
  }
}
</style>
