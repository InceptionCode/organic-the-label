import { useCallback, useRef, useState } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

// Visible checkbox hCaptcha (used on signup, matching v1). The user completes it before submitting;
// the token is single use, so call reset() after every submit attempt.
export function useCheckboxCaptcha() {
  const ref = useRef<HCaptcha>(null)
  const [token, setToken] = useState('')

  const reset = useCallback(() => {
    ref.current?.resetCaptcha()
    setToken('')
  }, [])

  const element = (
    <HCaptcha
      ref={ref}
      sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
      theme="dark"
      onVerify={(value) => setToken(value)}
      onExpire={() => setToken('')}
      onError={(code) => {
        console.error('[hcaptcha] checkbox error:', code)
        setToken('')
      }}
    />
  )

  return { element, token, reset }
}

// Invisible hCaptcha: most visitors are verified silently at submit; suspicious traffic may see a challenge.
// Supabase Attack Protection requires a token on every auth call, including password sign-in.
export function useInvisibleCaptcha() {
  const ref = useRef<HCaptcha>(null)

  const getToken = useCallback(async (): Promise<string> => {
    const captcha = ref.current
    if (!captcha) throw new Error('captcha-not-mounted')
    // Tokens are single use, so reset before each execution to always get a fresh one.
    captcha.resetCaptcha()
    try {
      const { response } = await captcha.execute({ async: true })
      return response
    } catch (error) {
      // hCaptcha rejects with a code such as challenge-closed, network-error, or invalid-data.
      const code = error instanceof Error ? error.message : String(error)
      console.error('[hcaptcha] execute failed:', code)
      throw new Error(code)
    }
  }, [])

  const element = (
    <HCaptcha ref={ref} sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY} size="invisible" />
  )

  return { element, getToken }
}

export function CaptchaNotice() {
  return (
    <p className="text-caption text-muted">
      This site is protected by hCaptcha and its{' '}
      <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and{' '}
      <a href="https://www.hcaptcha.com/terms" target="_blank" rel="noreferrer">Terms of Service</a> apply.
    </p>
  )
}

export const CAPTCHA_FAILED = 'We could not verify you are human. Please try again.'

// Shows the hCaptcha error code in local development only, to diagnose failures.
export function captchaFailedMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  return import.meta.env.DEV && code ? `${CAPTCHA_FAILED} (hCaptcha: ${code})` : CAPTCHA_FAILED
}
