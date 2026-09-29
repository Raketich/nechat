/** Wire format — mirrors server/src/protocol.ts. */

export type Role = 'system' | 'user' | 'assistant'

export interface ApiMessage {
  role: Role
  content: string
}

export type ChatEvent =
  | { type: 'delta'; text: string }
  | {
      type: 'error'
      code: number
      message: string
      retriable: boolean
      partial: boolean
    }
  | { type: 'done'; reason: 'stop' | 'aborted' }

export type MessageStatus = 'streaming' | 'done' | 'stopped' | 'error'

export interface UiMessage {
  id: string
  role: Role
  content: string
  status: MessageStatus
  error?: { code: number; message: string; retriable: boolean; partial: boolean }
}
