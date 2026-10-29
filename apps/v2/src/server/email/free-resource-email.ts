// The free resource download email (port of v1 lib/email/resend.ts sendFreeResourceEmail). Pure
// builder: the request service sends it through the shared Resend client. Every interpolated value
// is escaped (v1 put the first name into the HTML raw).

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (ch) => ESCAPES[ch]!)

export type FreeResourceEmailInput = { firstName?: string; resourceName: string; downloadUrl: string }

export function buildFreeResourceEmail({ firstName, resourceName, downloadUrl }: FreeResourceEmailInput) {
  const name = firstName ? escapeHtml(firstName) : ''
  const resource = escapeHtml(resourceName)
  const href = escapeHtml(downloadUrl)

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#171717;">
  <p style="font-size:16px;">What's good${name ? `, ${name}` : ''}.</p>
  <p style="font-size:16px;">Your free resource is ready. Click below to download it.</p>
  <p style="margin:32px 0;">
    <a href="${href}" style="background:#C8351F;color:#fff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:15px;font-weight:600;display:inline-block;">Download ${resource}</a>
  </p>
  <p style="font-size:14px;color:#7A7060;">
    If the button doesn't work, copy and paste this link into your browser:<br/>
    <a href="${href}" style="color:#C8351F;">${href}</a>
  </p>
  <p style="font-size:15px;margin-top:40px;">Peace,<br/>Organic Sonics</p>
</div>`.trim()

  const text = [
    `What's good${firstName ? `, ${firstName}` : ''}.`,
    '',
    'Your free resource is ready. Download it here:',
    downloadUrl,
    '',
    'Peace,',
    'Organic Sonics',
  ].join('\n')

  return { subject: `Your ${resourceName} is inside`, html, text }
}
