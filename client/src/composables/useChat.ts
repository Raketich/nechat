import { computed, reactive, ref } from 'vue'
import type { ApiMessage, ChatEvent, UiMessage } from '../types'

/** Collect `data: {...}` lines from the SSE byte stream. */
async function* sseEvents(res: Response): AsyncGenerator<ChatEvent> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      try {
        yield JSON.parse(trimmed.slice('data:'.length)) as ChatEvent
      } catch {
        // malformed line — skip rather than kill the stream
      }
    }
  }
}

export function useChat() {
  const messages = ref<UiMessage[]>([])
  const isStreaming = computed(() =>
    messages.value.some((m) => m.status === 'streaming'),
  )

  let controller: AbortController | null = null

  async function stream(history: ApiMessage[]) {
    // reactive(): we mutate this object later while streaming — a plain
    // object pushed into the ref would be stored raw and the UI would
    // never see the updates.
    const assistant = reactive<UiMessage>({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      status: 'streaming',
    })
    messages.value.push(assistant)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller!.signal,
      })

      if (!res.ok || !res.body) {
        // Non-SSE failure (400 validation, 500 config, …)
        const detail = (await res.json().catch(() => null)) as { error?: string } | null
        assistant.status = 'error'
        assistant.error = {
          code: res.status,
          message: detail?.error ?? `Request failed with status ${res.status}`,
          retriable: res.status >= 500,
          partial: false,
        }
        return
      }

      for await (const event of sseEvents(res)) {
        if (event.type === 'delta') {
          assistant.content += event.text
        } else if (event.type === 'error') {
          assistant.status = 'error'
          assistant.error = event
        } else {
          assistant.status = event.reason === 'aborted' ? 'stopped' : 'done'
        }
      }

      if (assistant.status === 'streaming') {
        // stream closed without a done event — treat as a network drop
        assistant.status = 'error'
        assistant.error = {
          code: 502,
          message: 'Connection closed unexpectedly',
          retriable: true,
          partial: assistant.content.length > 0,
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Stop button — keep whatever has already arrived
        assistant.status = 'stopped'
      } else {
        assistant.status = 'error'
        assistant.error = {
          code: 0,
          message: err instanceof Error ? err.message : 'Network error',
          retriable: true,
          partial: assistant.content.length > 0,
        }
      }
    } finally {
      controller = null
    }
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming.value) return

    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      status: 'done',
    })

    controller = new AbortController()
    await stream(
      messages.value
        .filter((m) => m.status !== 'error')
        .map(({ role, content }) => ({ role, content })),
    )
  }

  /** Drop the failed assistant reply and re-run the last user turn. */
  async function retry() {
    if (isStreaming.value) return
    const lastError = [...messages.value].reverse().find((m) => m.status === 'error')
    if (!lastError) return
    messages.value.splice(messages.value.indexOf(lastError), 1)
    controller = new AbortController()
    await stream(
      messages.value.map(({ role, content }) => ({ role, content })),
    )
  }

  function stop() {
    controller?.abort()
  }

  return { messages, isStreaming, send, stop, retry }
}
