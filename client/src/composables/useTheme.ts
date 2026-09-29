import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'nechat.theme'

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(initialTheme())

// The stylesheet keys off [data-theme] only; the composable applies it.
// Persisting happens on an explicit toggle below, so a visitor who never
// chose keeps following the OS setting.
watch(theme, (value) => {
  document.documentElement.dataset.theme = value
}, { immediate: true })

// Follow OS-level changes while the user has not made an explicit choice.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    theme.value = event.matches ? 'dark' : 'light'
  }
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, theme.value)
  }
  return { theme, toggle }
}
