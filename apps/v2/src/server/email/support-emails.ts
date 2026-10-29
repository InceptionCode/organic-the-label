import type { SendEmailInput } from './resend'

// Port of v1 lib/email/resend.ts support emails (sendSupportConfirmationEmail and
// sendSupportNotificationEmail). Builders are pure so tests check the exact payloads; v1
// interpolated user input into the HTML unescaped, v2 escapes every value.

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]!)

const WRAP = 'font-family:sans-serif;max-width:560px;margin:0 auto;color:#171717;'
const LABEL = 'padding:8px 0;color:#7A7060;'

export type SupportEmailAddresses = { from: string; forwardTo: string }

export type SupportConfirmationInput = { to: string; name: string; supportRequestId: string }

export function buildSupportConfirmationEmail(input: SupportConfirmationInput, from: string): SendEmailInput {
  const name = escapeHtml(input.name)
  const id = escapeHtml(input.supportRequestId)
  return {
    from,
    to: input.to,
    subject: 'We got your message',
    html: `<div style="${WRAP}">
  <p style="font-size:16px;">Hey ${name},</p>
  <p style="font-size:16px;">Thanks for reaching out to Organic Sonics. Your message landed safely. We'll get back to you as soon as possible.</p>
  <p style="font-size:14px;color:#7A7060;">Reference ID: ${id}</p>
  <p style="font-size:15px;margin-top:40px;">Organic Sonics</p>
</div>`,
    text: [
      `Hey ${input.name},`,
      '',
      "Thanks for reaching out to Organic Sonics. Your message landed safely. We'll get back to you as soon as possible.",
      '',
      `Reference ID: ${input.supportRequestId}`,
      '',
      'Organic Sonics',
    ].join('\n'),
  }
}

export type SupportNotificationInput = {
  supportRequestId: string
  name: string
  email: string
  category: string
  subject?: string
  message: string
}

const categoryLabel = (category: string) => category.replace(/_/g, ' ')

export function buildSupportNotificationEmail(input: SupportNotificationInput, addresses: SupportEmailAddresses): SendEmailInput {
  const category = categoryLabel(input.category)
  const row = (label: string, value: string, extra = '') =>
    `<tr><td style="${LABEL}${extra}">${label}</td><td${label === 'Message' ? ' style="white-space:pre-wrap;"' : ''}>${value}</td></tr>`
  const email = escapeHtml(input.email)
  return {
    from: addresses.from,
    to: addresses.forwardTo,
    // Replying goes straight to the person who wrote in (v1 had no reply-to).
    replyTo: input.email,
    subject: `New Organic Sonics support request: ${category}`,
    html: `<div style="${WRAP}">
  <h2 style="font-size:18px;margin-bottom:24px;">New Support Request</h2>
  <table style="width:100%;border-collapse:collapse;font-size:15px;">
    ${row('ID', escapeHtml(input.supportRequestId), 'width:120px;')}
    ${row('Name', escapeHtml(input.name))}
    ${row('Email', `<a href="mailto:${email}" style="color:#C8351F;">${email}</a>`)}
    ${row('Category', escapeHtml(category))}
    ${input.subject ? row('Subject', escapeHtml(input.subject)) : ''}
    ${row('Message', escapeHtml(input.message), 'vertical-align:top;')}
  </table>
</div>`,
    text: [
      'New Support Request',
      '',
      `ID: ${input.supportRequestId}`,
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Category: ${category}`,
      ...(input.subject ? [`Subject: ${input.subject}`] : []),
      '',
      input.message,
    ].join('\n'),
  }
}
