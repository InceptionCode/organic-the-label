const MAILERLITE_BASE_URL = "https://connect.mailerlite.com/api"

async function mailerLiteFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${MAILERLITE_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`MailerLite API error: ${res.status} ${errorBody}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export type MailerLiteSubscriberInput = {
  email: string
  firstName?: string
  fields?: Record<string, string | number | boolean | null>
  groupIds?: string[]
}

export async function upsertMailerLiteSubscriber(
  input: MailerLiteSubscriberInput
): Promise<{ id: string } | null> {
  const body: Record<string, unknown> = {
    email: input.email,
  }

  if (input.fields || input.firstName) {
    body.fields = {
      ...(input.firstName ? { name: input.firstName } : {}),
      ...input.fields,
    }
  }

  if (input.groupIds?.length) {
    body.groups = input.groupIds
  }

  const data = await mailerLiteFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  })

  return data?.data ?? null
}

export async function assignSubscriberToGroup(
  subscriberId: string,
  groupId: string
): Promise<void> {
  await mailerLiteFetch(`/groups/${groupId}/subscribers/${subscriberId}`, {
    method: "POST",
  })
}

export async function removeSubscriberFromGroup(
  subscriberId: string,
  groupId: string
): Promise<void> {
  await mailerLiteFetch(`/groups/${groupId}/subscribers/${subscriberId}`, {
    method: "DELETE",
  })
}
