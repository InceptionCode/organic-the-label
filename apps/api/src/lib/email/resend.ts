import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const STATUS_COPY: Record<
  "pending" | "closed",
  { subject: string; intro: string; fallback: string }
> = {
  pending: {
    subject: "We need a bit more information",
    intro: "We're looking into your request but could use a bit more from you.",
    fallback:
      "Please reply to this email with any additional details and we'll pick it right back up.",
  },
  closed: {
    subject: "Your request has been resolved",
    intro: "Good news — we've resolved your support request.",
    fallback: "If you have any further questions, don't hesitate to reach out.",
  },
};

export async function sendSupportStatusEmail({
  to,
  name,
  status,
  resolutionNote,
  supportRequestId,
}: {
  to: string;
  name: string;
  status: "pending" | "closed";
  resolutionNote?: string | null;
  supportRequestId: string;
}) {
  const copy = STATUS_COPY[status];
  const noteHtml = resolutionNote
    ? `<p style="font-size:16px;white-space:pre-wrap;">${resolutionNote}</p>`
    : `<p style="font-size:15px;color:#7A7060;">${copy.fallback}</p>`;

  return getResend().emails.send({
    from: process.env.EMAIL_FROM_SUPPORT!,
    to,
    subject: copy.subject,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#171717;">
        <p style="font-size:16px;">Hey ${name},</p>
        <p style="font-size:16px;">${copy.intro}</p>
        ${noteHtml}
        <p style="font-size:14px;color:#7A7060;">Reference ID: ${supportRequestId}</p>
        <p style="font-size:15px;margin-top:40px;">Organic Sonics</p>
      </div>
    `,
  });
}
