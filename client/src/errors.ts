import type { MessageKey } from './composables/useI18n'

/** Map a wire error code to the human wording key for the UI. */
export function errorKeyFor(code: number | undefined): MessageKey | null {
  if (code === 429) return 'errorRateLimited'
  if (code === 504) return 'errorTimeout'
  if (code === 0) return 'errorNetwork'
  return code == null ? null : 'errorGeneric'
}
