import { describe, it, expect, vi } from 'vitest'
import InitAuthStore from '@/store/init-auth-store'
import { AuthStoreProvider } from '@/store/auth-context'
import { signedInUser } from '../../fixtures/users'

vi.mock('@/app/api/auth/get-user', () => ({
  getUserAction: vi.fn(),
}))

import { getUserAction } from '@/app/api/auth/get-user'

// InitAuthStore is an async Server Component — invoke it directly rather than
// rendering, since it just needs to hand the fetched user to AuthStoreProvider
// as initialUser.
describe('InitAuthStore', () => {
  it('passes the server-fetched user through to AuthStoreProvider as initialUser', async () => {
    vi.mocked(getUserAction).mockResolvedValue({ user: signedInUser, error: null })

    const element = await InitAuthStore({ children: <div>child</div> })

    expect(element.type).toBe(AuthStoreProvider)
    expect(element.props.initialUser).toEqual(signedInUser)
    expect(element.props.children).toEqual(<div>child</div>)
  })

  it('passes null through when there is no server session', async () => {
    vi.mocked(getUserAction).mockResolvedValue({ user: null, error: null })

    const element = await InitAuthStore({ children: <div>child</div> })

    expect(element.props.initialUser).toBeNull()
  })
})
