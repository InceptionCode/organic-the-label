import { describe, expect, test } from 'bun:test'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { isSplashExcludedPath, shouldShowSplash, type SplashEnv } from '~/lib/splash-gate'
import {
  BEATS,
  beatOpacity,
  clampTarget,
  COMMIT_MARGIN,
  DESKTOP_FRAMES,
  frameIndex,
  frameSetFor,
  isCommitted,
  MAX_STEP,
  MOBILE_FRAMES,
  stepProgress,
  TARGET_MAX,
  wheelDelta,
} from '~/components/splash/scrub-math'

const env = (over: Partial<SplashEnv> = {}): SplashEnv => ({
  pathname: '/',
  search: '',
  seen: false,
  reducedMotion: false,
  webdriver: false,
  saveData: false,
  phone: false,
  effectiveType: undefined,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0 Safari/537.36',
  ...over,
})

describe('splash gate', () => {
  test('shows on a fresh session on public pages', () => {
    for (const pathname of ['/', '/store', '/store/wave-pack', '/compositions', '/work-with-me', '/search']) {
      expect(shouldShowSplash(env({ pathname }))).toBe(true)
    }
  })

  test('phones on 3G or slower skip it; desktops and unknown connections do not', () => {
    for (const effectiveType of ['slow-2g', '2g', '3g']) {
      expect(shouldShowSplash(env({ phone: true, effectiveType }))).toBe(false)
      expect(shouldShowSplash(env({ phone: false, effectiveType }))).toBe(true)
    }
    expect(shouldShowSplash(env({ phone: true, effectiveType: '4g' }))).toBe(true)
    // Safari and Firefox do not report a connection type: shown.
    expect(shouldShowSplash(env({ phone: true, effectiveType: undefined }))).toBe(true)
    expect(shouldShowSplash(env({ phone: true, effectiveType: '2g', search: '?splash=force' }))).toBe(true)
  })

  test('once per session', () => {
    expect(shouldShowSplash(env({ seen: true }))).toBe(false)
  })

  test('never for reduced motion, webdriver, Save-Data or crawlers', () => {
    expect(shouldShowSplash(env({ reducedMotion: true }))).toBe(false)
    expect(shouldShowSplash(env({ webdriver: true }))).toBe(false)
    expect(shouldShowSplash(env({ saveData: true }))).toBe(false)
    expect(shouldShowSplash(env({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }))).toBe(false)
    expect(shouldShowSplash(env({ userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0)' }))).toBe(false)
    // A phone brand containing "bot" is not a crawler.
    expect(shouldShowSplash(env({ userAgent: 'Mozilla/5.0 (Linux; Android 12; CUBOT X50) Chrome/120 Mobile' }))).toBe(true)
  })

  test('never on auth, account, api or download paths', () => {
    for (const pathname of [
      '/auth/confirm',
      '/login',
      '/login/reset-password',
      '/signup',
      '/account',
      '/api/track',
      '/compositions/download/some-loop',
      '/free/download/abc',
    ]) {
      expect(isSplashExcludedPath(pathname)).toBe(true)
      expect(shouldShowSplash(env({ pathname }))).toBe(false)
    }
    expect(isSplashExcludedPath('/accounting-tips')).toBe(false)
    expect(isSplashExcludedPath('/free')).toBe(false)
  })

  test('?splash=force overrides every rule', () => {
    expect(
      shouldShowSplash(env({ search: '?splash=force', seen: true, webdriver: true, reducedMotion: true, saveData: true, pathname: '/login' })),
    ).toBe(true)
    expect(shouldShowSplash(env({ search: '?splash=1', webdriver: true }))).toBe(false)
  })
})

describe('splash frame sets', () => {
  test('desktop below md is the lighter set', () => {
    expect(frameSetFor(false)).toBe(DESKTOP_FRAMES)
    expect(frameSetFor(true)).toBe(MOBILE_FRAMES)
    expect(DESKTOP_FRAMES.count).toBe(153)
    expect(MOBILE_FRAMES.count).toBe(77)
    expect(DESKTOP_FRAMES.path(7)).toBe('/organic-sonics-hero/assets/hero/frame_0007.webp')
    expect(MOBILE_FRAMES.path(76)).toBe('/organic-sonics-hero/assets/hero-mobile/frame_0076.webp')
  })

  test('every frame path exists in public/', () => {
    for (const set of [DESKTOP_FRAMES, MOBILE_FRAMES]) {
      for (let i = 0; i < set.count; i++) expect(existsSync(resolve(import.meta.dir, '../../public', `.${set.path(i)}`))).toBe(true)
      const dir = resolve(import.meta.dir, '../../public', `.${set.path(0)}`, '..')
      expect(readdirSync(dir).filter((f) => f.endsWith('.webp')).length).toBe(set.count)
    }
  })

  test('progress maps to the first and last frame for either count', () => {
    for (const { count } of [DESKTOP_FRAMES, MOBILE_FRAMES]) {
      expect(frameIndex(0, count)).toBe(0)
      expect(frameIndex(1, count)).toBe(count - 1)
      expect(frameIndex(-0.5, count)).toBe(0)
      expect(frameIndex(1.2, count)).toBe(count - 1)
    }
    expect(frameIndex(0.5, 153)).toBe(76)
    expect(frameIndex(0.5, 77)).toBe(38)
  })
})

describe('splash scrub math', () => {
  test('target clamps to [0, 1 + commit margin + slack]', () => {
    expect(clampTarget(-1)).toBe(0)
    expect(clampTarget(5)).toBe(TARGET_MAX)
    expect(clampTarget(0.4)).toBe(0.4)
  })

  test('commits only past the margin', () => {
    expect(isCommitted(1)).toBe(false)
    expect(isCommitted(1 + COMMIT_MARGIN)).toBe(false)
    expect(isCommitted(1 + COMMIT_MARGIN + 0.001)).toBe(true)
  })

  test('wheel deltas are clamped against big flings', () => {
    expect(wheelDelta(5000)).toBe(wheelDelta(50))
    expect(wheelDelta(-5000)).toBe(-wheelDelta(50))
  })

  test('progress eases toward the target, capped per tick, never past 1', () => {
    expect(stepProgress(0, 1)).toBeCloseTo(MAX_STEP)
    expect(stepProgress(0, 0.1)).toBeCloseTo(0.02)
    expect(stepProgress(0.9999, TARGET_MAX)).toBe(1)
    let p = 0
    for (let i = 0; i < 200; i++) p = stepProgress(p, TARGET_MAX)
    expect(p).toBe(1)
  })

  test('beats: the opening line shows at rest, the mark stays at the end', () => {
    const [open, middle, mark] = BEATS
    expect(beatOpacity(open, 0)).toBe(1)
    expect(beatOpacity(open, 0.3)).toBe(0)
    expect(beatOpacity(middle, 0.46)).toBe(1)
    expect(beatOpacity(middle, 0.2)).toBe(0)
    expect(beatOpacity(mark, 1)).toBe(1)
    expect(beatOpacity(mark, 0.5)).toBe(0)
  })
})
