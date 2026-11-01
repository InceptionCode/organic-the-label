import { describe, expect, test } from 'bun:test'
import { sanitizeDescriptionHtml } from '~/server/catalog/sanitize-html'

describe('sanitizeDescriptionHtml', () => {
  test('keeps formatting', () => {
    const html = '<p>Hi <strong>there</strong></p><ul><li><a href="https://x.com/a?b=1">x</a></li></ul>'
    expect(sanitizeDescriptionHtml(html)).toBe(html)
  })

  test('removes scripts, styles, iframes, handlers, inline styles and javascript: URLs', () => {
    const out = sanitizeDescriptionHtml(
      '<p onclick="steal()" style="color:red">a</p><script>alert(1)</script><style>p{}</style><iframe src="x"></iframe>' +
        '<a href="javascript:alert(1)">b</a><a href=" jav&#x09;ascript:alert(1)">c</a><img src=x onerror=alert(1)>',
    )
    expect(out).not.toMatch(/script|onclick|onerror|style|iframe|javascript/i)
    expect(out).toContain('<p>a</p>')
  })

  test('nested tricks do not survive', () => {
    expect(sanitizeDescriptionHtml('<scr<script>x</script>ipt>alert(1)</script>')).not.toMatch(/<script/i)
  })

  test('empty input', () => {
    expect(sanitizeDescriptionHtml(null)).toBe('')
  })
})
