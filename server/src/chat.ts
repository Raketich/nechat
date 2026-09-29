import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { ChatEvent, ChatMessage, Role } from './protocol'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Test hook: point at a local mock to exercise streaming/abort without a key.
const upstreamUrl = () => process.env.OPENROUTER_URL ?? OPENROUTER_URL

/** Hard ceiling for a single generation, incl. model queueing time. */
const UPSTREAM_TIMEOUT_MS = 120_000
const MAX_MESSAGES = 100
const MAX_CONTENT_LENGTH = 32_000
const ROLES: readonly Role[] = ['system', 'user', 'assistant']

interface UpstreamChunkChoiceDelta {
  content?: string | null
}

interface UpstreamChunk {
  choices?: { delta?: UpstreamChunkChoiceDelta; finish_reason?: string | null }[]
  error?: { message?: string; code?: number | string }
}

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null
  const messages: ChatMessage[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null
    const { role, content } = item as Record<string, unknown>
    if (typeof role !== 'string' || !ROLES.includes(role as Role)) return null
    if (typeof content !== 'string' || content.length === 0 || content.length > MAX_CONTENT_LENGTH) {
      return null
    }
    messages.push({ role: role as Role, content })
  }
  return messages
}

function retriableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500
}

export function createChatRouter(getModel: () => string, getApiKey: () => string | undefined): Hono {
  const chat = new Hono()

  chat.post('/api/chat', async (c) => {
    if (!getApiKey()) {
      return c.json({ error: 'OPENROUTER_API_KEY is not configured on the server' }, 500)
    }

    const body = await c.req.json().catch(() => null)
    const messages = parseMessages(
      typeof body === 'object' && body !== null ? (body as { messages?: unknown }).messages : null,
    )
    if (!messages) {
      return c.json(
        {
          error: `body must be {"messages": [{"role": "system"|"user"|"assistant", "content": string}]}, 1–${MAX_MESSAGES} messages, 1–${MAX_CONTENT_LENGTH} chars each`,
        },
        400,
      )
    }

    return streamSSE(c, async (stream) => {
      const send = (event: ChatEvent) =>
        stream.writeSSE({ data: JSON.stringify(event) })

      // Abort when the browser goes away (Stop button / tab close) so we
      // stop paying for the upstream generation.
      const upstream = new AbortController()
      const onClientAbort = () => upstream.abort()
      c.req.raw.signal.addEventListener('abort', onClientAbort, { once: true })

      // AbortSignal.any combines the client-driven abort with a hard timeout.
      const timer = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      const signal = AbortSignal.any([upstream.signal, timer])

      try {
        const response = await fetch(upstreamUrl(), {
          method: 'POST',
          signal,
          headers: {
            Authorization: `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
            // OpenRouter app attribution (optional, recommended)
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'nechat',
          },
          body: JSON.stringify({
            model: getModel(),
            messages,
            stream: true,
          }),
        })

        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => '')
          let message = detail.slice(0, 500) || `OpenRouter responded ${response.status}`
          try {
            const parsed = JSON.parse(detail) as { error?: { message?: string } }
            message = parsed.error?.message ?? message
          } catch {
            // not JSON — keep the raw slice
          }
          await send({
            type: 'error',
            code: response.status,
            message,
            retriable: retriableStatus(response.status),
            partial: false,
          })
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let delivered = false
        let finished = false

        while (!finished) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const payload = trimmed.slice('data:'.length).trim()
            if (payload === '[DONE]') {
              finished = true
              break
            }

            let chunk: UpstreamChunk
            try {
              chunk = JSON.parse(payload) as UpstreamChunk
            } catch {
              continue // keep-alive comment or partial line — skip
            }

            if (chunk.error) {
              await send({
                type: 'error',
                code: typeof chunk.error.code === 'number' ? chunk.error.code : 502,
                message: chunk.error.message ?? 'Upstream stream error',
                retriable: true,
                partial: delivered,
              })
              return
            }

            const text = chunk.choices?.[0]?.delta?.content
            if (text) {
              delivered = true
              await send({ type: 'delta', text })
            }
          }
        }

        await send({ type: 'done', reason: 'stop' })
      } catch (err) {
        if (c.req.raw.signal.aborted) {
          // The client hung up (Stop / tab close) — nothing to report to it.
          return
        }
        const timedOut = timer.aborted
        const aborted = upstream.signal.aborted || (err instanceof Error && err.name === 'AbortError')
        if (aborted && !timedOut) {
          await send({ type: 'done', reason: 'aborted' }).catch(() => {})
          return
        }
        await send({
          type: 'error',
          code: timedOut ? 504 : 502,
          message: timedOut
            ? 'The model took too long to respond'
            : err instanceof Error
              ? `Network error talking to OpenRouter: ${err.message}`
              : 'Network error talking to OpenRouter',
          retriable: true,
          partial: false,
        }).catch(() => {})
      } finally {
        c.req.raw.signal.removeEventListener('abort', onClientAbort)
        upstream.abort()
      }
    })
  })

  return chat
}
