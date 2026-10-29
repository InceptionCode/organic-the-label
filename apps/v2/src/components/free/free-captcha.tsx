import { useSyncExternalStore } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

// Loaded with React.lazy by the request form once it nears the viewport or a field is focused, so
// the hCaptcha script never sits on the critical path (pages/free.md).

// The 303px checkbox widget only fits the form panel from lg (the md two-column card is narrower).
const LG_QUERY = '(min-width: 1024px)'
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(LG_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const useWidgetSize = () =>
  useSyncExternalStore<'normal' | 'compact'>(
    subscribe,
    () => (window.matchMedia(LG_QUERY).matches ? 'normal' : 'compact'),
    () => 'compact',
  )

export default function FreeCaptcha({ onToken }: { onToken: (token: string) => void }) {
  const size = useWidgetSize()
  return (
    <HCaptcha
      // react-hcaptcha ignores prop updates, so a size change remounts it (dropping the token).
      key={size}
      sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
      theme="dark"
      size={size}
      onVerify={onToken}
      onExpire={() => onToken('')}
      onError={(code) => {
        console.error('[hcaptcha] free resource widget error:', code)
        onToken('')
      }}
      onLoad={() => onToken('')}
    />
  )
}
