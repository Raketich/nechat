import { describe, expect, it } from 'vitest'
import { errorKeyFor } from '../src/errors'

describe('errorKeyFor', () => {
  it('maps 429 to the rate-limit wording', () => {
    expect(errorKeyFor(429)).toBe('errorRateLimited')
  })

  it('maps 504 to the timeout wording', () => {
    expect(errorKeyFor(504)).toBe('errorTimeout')
  })

  it('maps 0 (fetch failure) to the network wording', () => {
    expect(errorKeyFor(0)).toBe('errorNetwork')
  })

  it('falls back to the generic wording for other upstream codes', () => {
    expect(errorKeyFor(401)).toBe('errorGeneric')
    expect(errorKeyFor(502)).toBe('errorGeneric')
  })

  it('returns null when there is no error', () => {
    expect(errorKeyFor(undefined)).toBeNull()
  })
})
