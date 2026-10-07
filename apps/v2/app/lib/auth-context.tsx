import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from '@tanstack/react-router'
import { createSupabaseBrowserClient } from '~/lib/supabase/browser'
import { mapSupabaseUser, type User } from '~/lib/supabase/map-user'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null
  children: ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      await router.invalidate()
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      await router.invalidate()
    } finally {
      setIsLoading(false)
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
