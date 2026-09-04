import { Resend } from "resend"

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendFreeResourceEmail({
  to,
  firstName,
  resourceName,
  downloadUrl,
}: {
  to: string
  firstName?: string
  resourceName: string
  downloadUrl: string
}) {
  return getResend().emails.send({
    from: process.env.EMAIL_FROM_DOWNLOADS!,
    replyTo: process.env.EMAIL_FROM_SUPPORT!,
    to,
    subject: `Your ${resourceName} is inside`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#171717;">
        <p style="font-size:16px;">What's good${firstName ? `, ${firstName}` : ""}.</p>
        <p style="font-size:16px;">Your free resource is ready. Click below to download it.</p>
        <p style="margin:32px 0;">
          <a href="${downloadUrl}"
             style="background:#C8351F;color:#fff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:15px;font-weight:600;display:inline-block;">
            Download ${resourceName}
          </a>
        </p>
        <p style="font-size:14px;color:#7A7060;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${downloadUrl}" style="color:#C8351F;">${downloadUrl}</a>
        </p>
        <p style="font-size:15px;margin-top:40px;">Peace,<br/>Organic Sonics</p>
      </div>
    `,
  })
}

export async function sendSupportConfirmationEmail({
  to,
  name,
  supportRequestId,
}: {
  to: string
  name: string
  supportRequestId: string
}) {
  return getResend().emails.send({
    from: process.env.EMAIL_FROM_SUPPORT!,
    to,
    subject: "We got your message",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#171717;">
        <p style="font-size:16px;">Hey ${name},</p>
        <p style="font-size:16px;">
          Thanks for reaching out to Organic Sonics. Your message landed safely.
          We'll get back to you as soon as possible.
        </p>
        <p style="font-size:14px;color:#7A7060;">Reference ID: ${supportRequestId}</p>
        <p style="font-size:15px;margin-top:40px;">Organic Sonics</p>
      </div>
    `,
  })
}

export async function sendSupportNotificationEmail({
  supportRequestId,
  name,
  email,
  category,
  subject,
  message,
}: {
  supportRequestId: string
  name: string
  email: string
  category: string
  subject?: string
  message: string
}) {
  return getResend().emails.send({
    from: process.env.EMAIL_FROM_SUPPORT!,
    to: process.env.SUPPORT_FORWARD_EMAIL!,
    subject: `New Organic Sonics support request: ${category.replace(/_/g, " ")}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#171717;">
        <h2 style="font-size:18px;margin-bottom:24px;">New Support Request</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#7A7060;width:120px;">ID</td><td>${supportRequestId}</td></tr>
          <tr><td style="padding:8px 0;color:#7A7060;">Name</td><td>${name}</td></tr>
          <tr><td style="padding:8px 0;color:#7A7060;">Email</td><td><a href="mailto:${email}" style="color:#C8351F;">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#7A7060;">Category</td><td>${category.replace(/_/g, " ")}</td></tr>
          ${subject ? `<tr><td style="padding:8px 0;color:#7A7060;">Subject</td><td>${subject}</td></tr>` : ""}
          <tr>
            <td style="padding:8px 0;color:#7A7060;vertical-align:top;">Message</td>
            <td style="white-space:pre-wrap;">${message}</td>
          </tr>
        </table>
      </div>
    `,
  })
}
