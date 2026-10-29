// Phase 07.7 session splash: who sees it. Pure decision plus a thin browser reader, kept tiny because
// the gate ships in the entry graph (the overlay itself is a lazy chunk).

export const SPLASH_STORAGE_KEY = 'splashSeen'

/** Pages where an intro would get in the way: auth flows, the account, API and download routes. */
const EXCLUDED = [/^\/auth(\/|$)/, /^\/login/, /^\/signup(\/|$)/, /^\/account(\/|$)/, /^\/api(\/|$)/, /\/download(\.|\/|$)/]

// Named crawlers only: a bare "bot" would also match phone models such as Cubot.
const BOT_UA =
  /googlebot|bingbot|duckduckbot|baiduspider|yandex|applebot|slurp|facebookexternalhit|twitterbot|linkedinbot|ahrefsbot|semrushbot|petalbot|gptbot|claudebot|crawler|spider/i

export type SplashEnv = {
  pathname: string
  search: string
  /** `sessionStorage.splashSeen === 'true'`. */
  seen: boolean
  reducedMotion: boolean
  webdriver: boolean
  saveData: boolean
  /** Below the md breakpoint; same query as MOBILE_FRAMES_QUERY in scrub-math (not imported, to keep the entry small). */
  phone: boolean
  /** Network Information API `effectiveType`; undefined where unsupported (Safari, Firefox). */
  effectiveType: string | undefined
  userAgent: string
}

const PHONE_QUERY = '(max-width: 767px)'
// Owner decision 2026-10-29: phones on 3G or slower skip the splash (even the light set is ~1.9 MB).
const SLOW_CONNECTIONS = ['slow-2g', '2g', '3g']

export const isSlowPhone = (env: Pick<SplashEnv, 'phone' | 'effectiveType'>) =>
  env.phone && env.effectiveType !== undefined && SLOW_CONNECTIONS.includes(env.effectiveType)

export const isSplashExcludedPath = (pathname: string) => EXCLUDED.some((re) => re.test(pathname))

export const isSplashForced = (search: string) => new URLSearchParams(search).get('splash') === 'force'

/**
 * `?splash=force` always shows it (testing); otherwise once per session, never for automation, slow
 * phones (3G or slower) or on excluded paths.
 */
export function shouldShowSplash(env: SplashEnv): boolean {
  if (isSplashForced(env.search)) return true
  if (env.seen || env.reducedMotion || env.webdriver || env.saveData || isSlowPhone(env)) return false
  if (BOT_UA.test(env.userAgent)) return false
  return !isSplashExcludedPath(env.pathname)
}

type NetworkNavigator = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SPLASH_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function markSplashSeen() {
  try {
    window.sessionStorage.setItem(SPLASH_STORAGE_KEY, 'true')
  } catch {
    // Storage blocked (private mode, policy): the splash may show again next page load. Acceptable.
  }
}

export function readSplashEnv(): SplashEnv {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    seen: readSeen(),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webdriver: navigator.webdriver === true,
    saveData: (navigator as NetworkNavigator).connection?.saveData === true,
    phone: window.matchMedia(PHONE_QUERY).matches,
    effectiveType: (navigator as NetworkNavigator).connection?.effectiveType,
    userAgent: navigator.userAgent,
  }
}
