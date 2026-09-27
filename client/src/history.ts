import type { UiMessage } from './types'

/**
 * Decision (documented in README): history survives page reload via
 * localStorage, scoped to the browser. The assignment only requires
 * session-scoped history and leaves the reload question to us; a database
 * would add deployment cost with no requirement behind it.
 */
const HISTORY_KEY = 'nechat.history.v1'
const DRAFT_KEY = 'nechat.draft.v1'

const ROLES = ['system', 'user', 'assistant'] as const

interface StoredMessage {
  role: unknown
  content: unknown
  status: unknown
  error?: unknown
}

function reviveMessage(item: StoredMessage, index: number): UiMessage | null {
  if (typeof item?.role !== 'string' || !ROLES.includes(item.role as UiMessage['role'])) return null
  if (typeof item?.content !== 'string') return null

  // A message can never legitimately be "streaming" after a reload: the
  // generation died with the page. Keep partial text as stopped, drop empty.
  let status = item.status
  if (status === 'streaming') {
    if (item.content.length === 0) return null
    status = 'stopped'
  }
  if (status !== 'done' && status !== 'stopped' && status !== 'error') return null

  const error =
    typeof item.error === 'object' && item.error !== null
      ? (item.error as UiMessage['error'])
      : undefined
  if (status === 'error' && !error) return null

  return {
    id: `${Date.now()}-${index}`,
    role: item.role as UiMessage['role'],
    content: item.content,
    status,
    error,
  }
}

export function loadHistory(): UiMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { version?: number; messages?: StoredMessage[] }
    if (parsed.version !== 1 || !Array.isArray(parsed.messages)) return []
    return parsed.messages
      .map(reviveMessage)
      .filter((m): m is UiMessage => m !== null)
  } catch {
    return [] // corrupted storage — start clean rather than break the app
  }
}

export function saveHistory(messages: UiMessage[]): void {
  const serializable = messages.map(({ role, content, status, error }) => ({
    role,
    content,
    status,
    error,
  }))
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, messages: serializable }))
  } catch {
    // quota/private mode — persistence is best-effort
  }
}

export function loadDraft(): string {
  return localStorage.getItem(DRAFT_KEY) ?? ''
}

export function saveDraft(text: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, text)
  } catch {
    // best-effort
  }
}
