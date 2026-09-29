/**
 * Types shared between the server proxy and the browser client.
 * Client keeps its own copy in client/src/types.ts (no shared package for
 * a two-package repo keeps the build simple; the shapes are small and
 * covered by tests on both sides).
 */

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
}

/** Events the proxy streams to the browser over SSE. */
export type ChatEvent =
  | { type: 'delta'; text: string }
  | {
      type: 'error'
      /** HTTP-ish code: 429 rate limit, 504 timeout, 502 upstream, 500 config */
      code: number
      message: string
      /** true when the client may reasonably retry the same request */
      retriable: boolean
      /** true when some assistant text was already delivered before the failure */
      partial: boolean
    }
  | { type: 'done'; reason: 'stop' | 'aborted' }
