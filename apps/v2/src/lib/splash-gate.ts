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
  userAgent: string
}

export const isSplashExcludedPath = (pathname: string) => EXCLUDED.some((re) => re.test(pathname))

export const isSplashForced = (search: string) => new URLSearchParams(search).get('splash') === 'force'

/** `?splash=force` always shows it (testing); otherwise once per session, never for automation or on excluded paths. */
export function shouldShowSplash(env: SplashEnv): boolean {
  if (isSplashForced(env.search)) return true
  if (env.seen || env.reducedMotion || env.webdriver || env.saveData) return false
  if (BOT_UA.test(env.userAgent)) return false
  return !isSplashExcludedPath(env.pathname)
}

type NetworkNavigator = Navigator & { connection?: { saveData?: boolean } }

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
    userAgent: navigator.userAgent,
  }
}
