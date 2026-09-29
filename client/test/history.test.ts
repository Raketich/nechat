import { beforeEach, describe, expect, it } from 'vitest'
import { loadHistory } from '../src/history'
import type { UiMessage } from '../src/types'

const seed = (messages: unknown[], version = 1) => {
  localStorage.setItem('nechat.history.v1', JSON.stringify({ version, messages }))
}

describe('loadHistory restore rules', () => {
  beforeEach(() => localStorage.clear())

  it('restores done messages as-is (modulo fresh ids)', () => {
    seed([{ role: 'user', content: 'привет', status: 'done' }])
    const history = loadHistory()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ role: 'user', content: 'привет', status: 'done' })
  })

  it('turns a frozen streaming message with text into stopped', () => {
    seed([{ role: 'assistant', content: 'частичный', status: 'streaming' }])
    expect(loadHistory()[0]?.status).toBe('stopped')
  })

  it('drops an empty frozen streaming message', () => {
    seed([{ role: 'assistant', content: '', status: 'streaming' }])
    expect(loadHistory()).toHaveLength(0)
  })

  it('drops entries with an unknown status or bad role', () => {
    seed([
      { role: 'assistant', content: 'x', status: 'weird' },
      { role: 'robot', content: 'y', status: 'done' },
    ])
    expect(loadHistory()).toHaveLength(0)
  })

  it('keeps only well-formed error payloads', () => {
    seed([
      { role: 'assistant', content: '', status: 'error', error: { code: 429, message: 'm', retriable: true, partial: false } },
      { role: 'assistant', content: '', status: 'error', error: { oops: true } },
    ])
    const history = loadHistory()
    expect(history).toHaveLength(1)
    expect(history[0]?.error?.code).toBe(429)
  })

  it('returns [] on corrupt JSON or a wrong schema version', () => {
    localStorage.setItem('nechat.history.v1', '{not json')
    expect(loadHistory()).toEqual([])
    seed([{ role: 'user', content: 'x', status: 'done' }], 99)
    expect(loadHistory()).toEqual([])
  })
})
