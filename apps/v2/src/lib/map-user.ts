export type SessionUser = {
  id: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
}

type Metadata = Record<string, unknown> | undefined

type ClaimsLike = {
  sub: string
  email?: string
  is_anonymous?: boolean
  user_metadata?: Metadata
}

type UserLike = {
  id: string
  email?: string
  is_anonymous?: boolean
  email_confirmed_at?: string
  user_metadata?: Metadata
}

function displayNameFrom(meta: Metadata): string | null {
  const name = meta?.username ?? meta?.display_name
  return typeof name === 'string' && name.length > 0 ? name : null
}

// Legacy anonymous sessions from the first port count as signed out.
export function mapClaims(claims: ClaimsLike | null | undefined): SessionUser | null {
  if (!claims || claims.is_anonymous) return null
  return {
    id: claims.sub,
    email: claims.email || null,
    emailVerified: claims.user_metadata?.email_verified === true,
    displayName: displayNameFrom(claims.user_metadata),
  }
}

export function mapUser(user: UserLike | null | undefined): SessionUser | null {
  if (!user || user.is_anonymous) return null
  return {
    id: user.id,
    email: user.email || null,
    emailVerified: user.user_metadata?.email_verified === true || !!user.email_confirmed_at,
    displayName: displayNameFrom(user.user_metadata),
  }
}
