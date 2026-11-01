import type { Page } from '@playwright/test'
import { admin, contactByEmail, contactTags } from './support/admin'
import { appConfig, sandboxEmail } from './support/env'
import { E2E_USER_EMAIL, expect, forEmail, test, waitForHydration, type SandboxCall } from './support/fixtures'

// Free resource, contact and newsletter flows END TO END through the server, with the E2E sandbox
// recording Resend and MailerLite calls instead of sending (src/server/sandbox.ts), and the
// sandboxed hCaptcha verifier accepting the test token from the stubbed widget. Supabase writes
// are real (DEV project) and every e2e+ address is deleted after its test.

const NEWSLETTER_GROUP = appConfig('MAILERLITE_GROUP_NEWSLETTER_ID')
const LEADS_GROUP = appConfig('MAILERLITE_GROUP_FREE_RESOURCE_LEADS_ID')

const resendTo = (email: string) => (c: SandboxCall) => c.service === 'resend' && forEmail(email)(c)
const mailerliteFor = (email: string) => (c: SandboxCall) => c.service === 'mailerlite' && forEmail(email)(c)

async function requestFreeKit(page: Page, email: string, { consent }: { consent: boolean }) {
  await page.goto('/free')
  await waitForHydration(page)
  await page.getByRole('textbox', { name: 'First name (optional)' }).fill('E2E')
  await page.getByRole('textbox', { name: 'Email address (required)' }).fill(email)
  if (consent) await page.getByRole('checkbox', { name: /Also add me to the Organic Sonics newsletter/ }).check()
  await page.getByTestId('hcaptcha-stub').click()
  await page.getByRole('button', { name: 'Send me the free kit' }).click()
  await expect(page.getByRole('heading', { name: "IT'S ON THE WAY" })).toBeVisible()
}

/** The /free/download/{id} path from the recorded email's text body. */
function downloadPath(call: SandboxCall): string {
  const match = /\/free\/download\/([0-9a-f-]{36})/.exec(String(call.payload.text))
  expect(match, 'the email links to the tracked download route').not.toBeNull()
  return `/free/download/${match![1]}`
}

test.describe('free resource @smoke', () => {
  test('without consent: email recorded, leads groups only, contact not opted in, link downloads', async ({ page, request, sandbox, cleanupEmails }) => {
    const email = sandboxEmail('free')
    cleanupEmails.push(email)
    const mark = await sandbox.mark()

    await requestFreeKit(page, email, { consent: false })

    const [sent] = await sandbox.waitFor(mark, resendTo(email))
    expect(String(sent!.payload.subject)).toContain('is inside')
    const [upsert] = await sandbox.waitFor(mark, mailerliteFor(email))
    const groups = upsert!.payload.groups as string[]
    expect(groups).toContain(LEADS_GROUP)
    expect(groups).not.toContain(NEWSLETTER_GROUP)
    expect(upsert!.payload.resubscribe).toBeUndefined()

    const contact = await contactByEmail(email)
    expect(contact).toMatchObject({ status: 'subscribed', marketing_opt_in: false })
    expect(await contactTags(contact!.id)).toEqual(expect.arrayContaining(['free_resource', 'downloaded_starter_kit']))
    expect(await contactTags(contact!.id)).not.toContain('newsletter')

    // The emailed link: a no-store 302 to the file, stamped as downloaded once.
    const path = downloadPath(sent!)
    const res = await request.get(path, { maxRedirects: 0 })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/^https:\/\//)
    expect(res.headers()['cache-control']).toBe('private, no-store')
    const { data: row } = await admin().from('resource_downloads').select('downloaded_at, email_sent_at').eq('id', path.split('/').pop()!).single()
    expect(row?.downloaded_at).toBeTruthy()
    expect(row?.email_sent_at).toBeTruthy()
  })

  test('with consent: newsletter group added and the contact opted in', async ({ page, sandbox, cleanupEmails }) => {
    const email = sandboxEmail('free-consent')
    cleanupEmails.push(email)
    const mark = await sandbox.mark()

    await requestFreeKit(page, email, { consent: true })

    const [upsert] = await sandbox.waitFor(mark, mailerliteFor(email))
    expect(upsert!.payload.groups).toEqual(expect.arrayContaining([LEADS_GROUP, NEWSLETTER_GROUP]))
    expect(upsert!.payload.resubscribe).toBe(true)
    const contact = await contactByEmail(email)
    expect(contact).toMatchObject({ status: 'subscribed', marketing_opt_in: true })
    expect(await contactTags(contact!.id)).toContain('newsletter')
  })

  test('an unsubscribed contact stays unsubscribed and is not re-added to MailerLite', async ({ page, sandbox, cleanupEmails }) => {
    const email = sandboxEmail('free-unsub')
    cleanupEmails.push(email)
    const unsubscribedAt = new Date(Date.now() - 86_400_000).toISOString()
    await admin().from('email_contacts').insert({ email, status: 'unsubscribed', marketing_opt_in: false, unsubscribed_at: unsubscribedAt })
    const mark = await sandbox.mark()

    await requestFreeKit(page, email, { consent: false })

    await sandbox.waitFor(mark, resendTo(email)) // the resource itself is still delivered
    expect(await sandbox.since(mark, mailerliteFor(email))).toHaveLength(0)
    const contact = await contactByEmail(email)
    expect(contact).toMatchObject({ status: 'unsubscribed', marketing_opt_in: false })
    expect(new Date(contact!.unsubscribed_at!).toISOString()).toBe(unsubscribedAt)
  })

  test('the captcha is required before anything is sent', async ({ page, sandbox }) => {
    const email = sandboxEmail('free-nocaptcha')
    const mark = await sandbox.mark()
    await page.goto('/free')
    await waitForHydration(page)
    await page.getByRole('textbox', { name: 'Email address (required)' }).fill(email)
    await page.getByRole('button', { name: 'Send me the free kit' }).click()
    await expect(page.getByText('Please complete the captcha and try again.')).toBeVisible()
    expect(await sandbox.since(mark, forEmail(email))).toHaveLength(0)
    expect(await contactByEmail(email)).toBeNull()
  })

  test('unknown and malformed download ids are 404', async ({ request }) => {
    for (const id of ['00000000-0000-4000-8000-000000000000', 'not-a-uuid', '..%2F..%2Fadmin']) {
      const res = await request.get(`/free/download/${id}`, { maxRedirects: 0 })
      expect(res.status(), id).toBe(404)
    }
  })
})

test.describe('contact @smoke', () => {
  test('submits: confirmation and support notification recorded, request stored', async ({ page, sandbox, cleanupEmails }) => {
    const email = sandboxEmail('contact')
    cleanupEmails.push(email)
    const mark = await sandbox.mark()

    await page.goto('/contact')
    await waitForHydration(page)
    const send = page.getByRole('button', { name: 'Send message' })
    await expect(send).toBeDisabled() // until the captcha is done

    await page.getByTestId('hcaptcha-stub').click()
    await send.click()
    await expect(page.getByText('Please enter your name.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Name (required)' })).toBeFocused()

    await page.getByRole('textbox', { name: 'Name (required)' }).fill('E2E Tester')
    await page.getByRole('textbox', { name: 'Email (required)' }).fill(email)
    await page.getByRole('combobox', { name: 'Category (required)' }).selectOption('download_issue')
    await page.getByRole('textbox', { name: 'Subject (optional)' }).fill('E2E subject')
    await page.getByRole('textbox', { name: 'Message (required)' }).fill('Short')
    await send.click()
    await expect(page.getByText('Message must be at least 10 characters.')).toBeVisible()
    await page.getByRole('textbox', { name: 'Message (required)' }).fill('This is an automated E2E support request.')
    await send.click()
    await expect(page.getByRole('heading', { name: 'MESSAGE RECEIVED' })).toBeVisible()
    await expect(page.getByText(`A confirmation email is on its way to ${email}.`)).toBeVisible()

    const [confirmation] = await sandbox.waitFor(mark, resendTo(email))
    expect(confirmation!.payload.subject).toBe('We got your message')
    const forward = appConfig('SUPPORT_FORWARD_EMAIL')
    if (forward) {
      const [notification] = await sandbox.waitFor(mark, (c) => c.service === 'resend' && c.payload.replyTo === email)
      expect(notification!.payload.to).toBe(forward)
      expect(String(notification!.payload.subject)).toContain('download issue')
    }
    // No consent box ticked: no MailerLite call.
    expect(await sandbox.since(mark, mailerliteFor(email))).toHaveLength(0)

    const { data } = await admin().from('support_requests').select('category, subject, status').eq('email', email)
    expect(data).toEqual([{ category: 'download_issue', subject: 'E2E subject', status: 'open' }])
  })

  test('prefill from the URL seeds category and subject', async ({ page }) => {
    await page.goto('/contact?category=licensing_question&subject=Order%20%23E2E')
    await expect(page.getByRole('combobox', { name: 'Category (required)' })).toHaveValue('licensing_question')
    await expect(page.getByRole('textbox', { name: 'Subject (optional)' })).toHaveValue('Order #E2E')
    // Unknown values are dropped, not echoed.
    await page.goto('/contact?category=not_a_category')
    await expect(page.getByRole('combobox', { name: 'Category (required)' })).toHaveValue('general')
  })

  test('signed in: name and email are prefilled', async ({ page, signIn }) => {
    await signIn()
    await page.goto('/contact')
    await expect(page.getByRole('textbox', { name: 'Email (required)' })).toHaveValue(E2E_USER_EMAIL)
    await expect(page.getByRole('textbox', { name: 'Name (required)' })).toHaveValue('e2e_v2')
  })
})

test.describe('newsletter @smoke', () => {
  test('subscribe records a MailerLite upsert with resubscribe and opts the contact in', async ({ page, sandbox, cleanupEmails }) => {
    const email = sandboxEmail('news')
    cleanupEmails.push(email)
    const mark = await sandbox.mark()

    await page.goto('/newsletter')
    await waitForHydration(page)
    await page.getByRole('textbox', { name: 'Email (required)' }).fill(email)
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await expect(page.getByText('Check the consent box to continue.')).toBeVisible()

    await page.getByRole('checkbox', { name: /I agree to receive marketing emails/ }).check()
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await expect(page.getByRole('heading', { name: 'CHECK YOUR INBOX' })).toBeVisible()

    const [upsert] = await sandbox.waitFor(mark, mailerliteFor(email))
    expect(upsert!.action).toBe('upsert')
    expect(upsert!.payload).toMatchObject({ email, groups: [NEWSLETTER_GROUP], resubscribe: true })
    expect((upsert!.payload.fields as Record<string, unknown>).signup_source).toBe('newsletter_page')
    expect(await contactByEmail(email)).toMatchObject({ status: 'subscribed', marketing_opt_in: true })
  })
})
