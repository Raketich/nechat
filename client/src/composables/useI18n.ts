import { ref } from 'vue'

export type Lang = 'ru' | 'en'

const dictionaries = {
  ru: {
    send: 'Отправить',
    stop: 'Остановить',
    inputPlaceholder: 'Сообщение…',
    typing: 'Модель печатает',
    you: 'Вы',
    assistant: 'Модель',
    stoppedNote: 'Генерация остановлена',
    errorRateLimited: 'Лимит бесплатной модели исчерпан — подождите немного и попробуйте снова.',
    errorTimeout: 'Модель отвечала слишком долго. Попробуйте ещё раз.',
    errorNetwork: 'Проблема с сетью. Проверьте соединение и попробуйте снова.',
    errorGeneric: 'Не получилось получить ответ от модели.',
    retry: 'Повторить',
    partialNote: 'Ответ получен не полностью',
    emptyTitle: 'Чем займёмся?',
    emptySubtitle: 'Задайте вопрос или выберите пример ниже',
    promptExample1: 'Объясни, что такое квантовая запутанность, простыми словами',
    promptExample2: 'Напиши хайку про осенний дождь',
    promptExample3: 'Составь план тренировки на 20 минут дома',
    themeLight: 'Светлая тема',
    themeDark: 'Тёмная тема',
    langLabel: 'Переключить язык',
  },
  en: {
    send: 'Send',
    stop: 'Stop',
    inputPlaceholder: 'Type a message…',
    typing: 'Model is typing',
    you: 'You',
    assistant: 'Model',
    stoppedNote: 'Generation stopped',
    errorRateLimited: 'The free model rate limit is hit — wait a bit and try again.',
    errorTimeout: 'The model took too long to respond. Please try again.',
    errorNetwork: 'Network problem. Check your connection and try again.',
    errorGeneric: 'Failed to get a response from the model.',
    retry: 'Retry',
    partialNote: 'The response was cut short',
    emptyTitle: 'What are we working on?',
    emptySubtitle: 'Ask a question or pick an example below',
    promptExample1: 'Explain quantum entanglement in simple words',
    promptExample2: 'Write a haiku about autumn rain',
    promptExample3: 'Put together a 20-minute home workout plan',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
    langLabel: 'Switch language',
  },
} as const

export type MessageKey = keyof (typeof dictionaries)['ru']

const STORAGE_KEY = 'nechat.lang'

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'ru' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

const lang = ref<Lang>(detectLang())

export function useI18n() {
  function t(key: MessageKey): string {
    return dictionaries[lang.value][key]
  }

  function setLang(next: Lang) {
    lang.value = next
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }

  return { lang, setLang, t }
}
