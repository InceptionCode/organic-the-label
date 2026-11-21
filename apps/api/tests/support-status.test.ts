import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { buildSupportStatusEmail, escapeHtml, type SupportStatusEmailInput } from "../src/lib/email/resend.ts";
import { createSupportStatusRoute } from "../src/routes/support-status.ts";

// No request leaves the process: the email sender and Supabase client are fakes.

const SECRET = "support-secret-test";
const saved = { ...process.env };

type Row = { id: string; name: string | null; email: string; status: string; resolution_note: string | null };

const base: Row = { id: "req-1", name: "Maya", email: "Maya@Example.com", status: "open", resolution_note: null };

let sent: SupportStatusEmailInput[];
let inserted: unknown[];

function routeWith(sendFails = false) {
  sent = [];
  inserted = [];
  const sendEmail = mock(async (input: SupportStatusEmailInput) => {
    if (sendFails) throw new Error("resend down");
    sent.push(input);
    return { data: { id: "email-1" }, error: null };
  });
  const supabase = {
    from: (table: string) =>
      table === "email_contacts"
        ? { select: () => ({ eq: () => ({ single: async () => ({ data: { id: "contact-1" } }) }) }) }
        : { insert: async (row: unknown) => void inserted.push(row) },
  };
  return createSupportStatusRoute({
    sendEmail: sendEmail as never,
    createClient: (() => supabase) as never,
  });
}

function post(app: ReturnType<typeof routeWith>, old_record: Row, record: Row, secret = SECRET) {
  return app.request("/support-status", {
    method: "POST",
    headers: { "content-type": "application/json", "x-webhook-secret": secret },
    body: JSON.stringify({ type: "UPDATE", table: "support_requests", schema: "public", record, old_record }),
  });
}

beforeEach(() => {
  process.env.SUPABASE_SUPPORT_WEBHOOK_SECRET = SECRET;
});

afterEach(() => {
  process.env = { ...saved };
});

describe("POST /support-status", () => {
  test("rejects a wrong secret", async () => {
    const res = await post(routeWith(), base, { ...base, status: "closed" }, "nope");
    expect(res.status).toBe(401);
    expect(sent).toHaveLength(0);
  });

  test("emails on a status change to pending or closed", async () => {
    const app = routeWith();
    const res = await post(app, base, { ...base, status: "pending", resolution_note: "Send your order number." });
    expect(await res.json()).toMatchObject({ ok: true, status: "pending", reason: "status_changed" });
    expect(sent[0]).toMatchObject({ to: "Maya@Example.com", status: "pending", resolutionNote: "Send your order number." });
    expect(inserted[0]).toMatchObject({
      contact_id: "contact-1",
      event_type: "support_status_pending",
      metadata: { support_request_id: "req-1", reason: "status_changed" },
    });
  });

  test("emails when only the note changes at an emailable status", async () => {
    const pending = { ...base, status: "pending", resolution_note: "Send your order number." };
    const res = await post(routeWith(), pending, { ...pending, resolution_note: "Found it. Your link is below." });
    expect(await res.json()).toMatchObject({ ok: true, reason: "note_changed" });
    expect(sent).toHaveLength(1);
  });

  test("skips open, spam, unchanged and cleared notes", async () => {
    const pending = { ...base, status: "pending", resolution_note: "Send your order number." };
    const cases: Array<[Row, Row]> = [
      [base, { ...base, resolution_note: "Looking into it" }],
      [pending, { ...pending, status: "spam" }],
      [pending, pending],
      [pending, { ...pending, resolution_note: null }],
    ];
    for (const [before, after] of cases) {
      const res = await post(routeWith(), before, after);
      expect(await res.json()).toMatchObject({ ok: true, skipped: "no_customer_email" });
      expect(sent).toHaveLength(0);
    }
  });

  test("returns 500 when the email fails, so the failure is visible", async () => {
    const res = await post(routeWith(true), base, { ...base, status: "closed" });
    expect(res.status).toBe(500);
    expect(inserted).toHaveLength(0);
  });
});

describe("support status email", () => {
  test("escapes the customer's name and the note", () => {
    const { html } = buildSupportStatusEmail({
      to: "x@example.com",
      name: '<img src=x onerror="alert(1)">',
      status: "closed",
      resolutionNote: "Use <b>this</b> & that",
      supportRequestId: "req-1",
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("Use &lt;b&gt;this&lt;/b&gt; &amp; that");
  });

  test("falls back to the status copy when the note is blank", () => {
    const { html, subject } = buildSupportStatusEmail({ to: "x", name: "Maya", status: "pending", resolutionNote: "   ", supportRequestId: "r" });
    expect(subject).toBe("We need a bit more information");
    expect(html).toContain("Please reply to this email");
  });

  test("has no em dash in customer copy", () => {
    const { html } = buildSupportStatusEmail({ to: "x", name: "Maya", status: "closed", supportRequestId: "r" });
    expect(html).not.toContain("—");
    expect(escapeHtml("a—b")).toBe("a—b");
  });
});
