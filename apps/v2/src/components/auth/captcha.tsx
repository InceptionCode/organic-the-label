import { useRef, useState, useSyncExternalStore } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

// The normal checkbox widget is 303px wide; below `sm` the auth card is narrower, so use compact.
const SM_QUERY = '(min-width: 640px)'
const subscribeSm = (onChange: () => void) => {
  const media = window.matchMedia(SM_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
type CheckboxSize = 'normal' | 'compact'
const useCheckboxSize = () =>
  useSyncExternalStore<CheckboxSize>(
    subscribeSm,
    () => (window.matchMedia(SM_QUERY).matches ? 'normal' : 'compact'),
    () => 'normal',
  )

/** `theme` defaults to dark; pass 'light' when the widget sits on a light surface (the work-with-me sand band). */
export function useCheckboxCaptcha({ theme = 'dark' }: { theme?: 'light' | 'dark' } = {}) {
  const ref = useRef<HCaptcha>(null)
  const size = useCheckboxSize()
  // The widget remounts when its size changes (react-hcaptcha ignores prop updates), which drops its
  // token, so a token only counts for the size it was issued under.
  const [issued, setIssued] = useState({ size, token: '' })
  const token = issued.size === size ? issued.token : ''
  const setToken = (value: string) => setIssued({ size, token: value })

  const reset = () => {
    ref.current?.resetCaptcha()
    setToken('')
  }

  const element = (
    <HCaptcha
      key={size}
      ref={ref}
      sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
      theme={theme}
      size={size}
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

export function useInvisibleCaptcha() {
  const ref = useRef<HCaptcha>(null)

  const getToken = async (): Promise<string> => {
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
  }

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
