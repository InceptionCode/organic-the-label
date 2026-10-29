// Small sanitizer for Shopify descriptionHtml (admin-authored, rendered with
// dangerouslySetInnerHTML as in v1). Runs in the service before caching. Not a general purpose
// sanitizer: it removes the risky constructs pages/product.md lists and keeps formatting tags.

const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?(?:<\/\1\s*>|$)/gi
const DROP_TAGS = /<\/?(?:link|meta|base|form|input|button|textarea|select|frame|frameset)\b[^>]*>/gi
const EVENT_ATTR = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const STYLE_ATTR = /\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const URL_ATTR = /(\s(?:href|src|xlink:href|action|formaction)\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/gi
const SAFE_URL = /^(?:https?:|mailto:|tel:|\/|#)/i

function stripQuotes(v: string) {
  return v.replace(/^["']|["']$/g, '')
}

export function sanitizeDescriptionHtml(html: string | null | undefined): string {
  if (!html) return ''
  let out = html.replace(/<!--[\s\S]*?-->/g, '')
  // Repeat until stable so nested tricks like <scr<script>ipt> cannot survive one pass.
  let prev: string
  do {
    prev = out
    out = out.replace(DROP_WITH_CONTENT, '').replace(DROP_TAGS, '')
  } while (out !== prev)
  out = out.replace(EVENT_ATTR, '').replace(STYLE_ATTR, '')
  out = out.replace(URL_ATTR, (_m, attr: string, value: string) => {
    // Decode entities and drop control characters before checking the scheme.
    const raw = stripQuotes(value)
      .replace(/&#x?[0-9a-f]+;?/gi, '')
      .replace(/[\u0000- ]/g, '')
    return SAFE_URL.test(raw) ? `${attr}"${stripQuotes(value).replace(/"/g, '&quot;')}"` : ''
  })
  return out.trim()
}
