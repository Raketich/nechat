import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/markdown'

describe('renderMarkdown', () => {
  it('renders emphasis and code', () => {
    expect(renderMarkdown('**bold** and `code`')).toContain('<strong>bold</strong>')
    expect(renderMarkdown('**bold** and `code`')).toContain('<code>code</code>')
  })

  it('escapes raw HTML from model output', () => {
    const html = renderMarkdown('hello <img src=x onerror=alert(1)> <script>alert(1)</script>')
    // html:false escapes the markup into harmless text — no live tags remain.
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('opens links in a new tab with rel=noopener', () => {
    const html = renderMarkdown('[site](https://example.com)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })
})
