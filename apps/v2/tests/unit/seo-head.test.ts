import { describe, expect, test } from 'bun:test'
import { formatTitle, seo } from '~/seo/head'
import { SITE_ORIGIN } from '~/seo/site'

const canonicals = (links: { rel: string }[]) => links.filter((l) => l.rel === 'canonical')
const metaValue = (meta: Record<string, string>[], key: string) =>
  meta.find((m) => m.name === key || m.property === key)?.content

describe('formatTitle', () => {
  test.each([
    ['Explore – Organic Sonics', 'Explore | Organic Sonics'],
    ['Explore — Organic Sonics', 'Explore | Organic Sonics'],
    ['Explore - Organic Sonics', 'Explore | Organic Sonics'],
    ['Explore | Organic Sonics', 'Explore | Organic Sonics'],
    ['Explore|organic sonics', 'Explore | Organic Sonics'],
    ['Explore', 'Explore | Organic Sonics'],
    ['  Explore  ', 'Explore | Organic Sonics'],
  ])('%s -> %s', (input, expected) => {
    expect(formatTitle(input)).toBe(expected)
  })

  test('no title, empty title, or the bare brand is just the brand', () => {
    expect(formatTitle()).toBe('Organic Sonics')
    expect(formatTitle('')).toBe('Organic Sonics')
    expect(formatTitle('Organic Sonics')).toBe('Organic Sonics')
  })

  test('the brand inside a title is kept; only a trailing suffix is stripped', () => {
    expect(formatTitle('Organic Sonics Starter Kit')).toBe('Organic Sonics Starter Kit | Organic Sonics')
  })

  test('never doubles the brand', () => {
    for (const t of ['A | Organic Sonics', 'B – Organic Sonics', 'C']) {
      expect(formatTitle(t).match(/Organic Sonics/g)).toHaveLength(1)
    }
  })
})

describe('seo()', () => {
  const base = { title: 'Night Drive', description: 'A dark drum kit.', path: '/store/night-drive' }

  test('emits exactly one canonical against SITE_ORIGIN', () => {
    const { links } = seo(base)
    expect(canonicals(links)).toEqual([{ rel: 'canonical', href: `${SITE_ORIGIN}/store/night-drive` }])
  })

  test('canonical drops query and hash', () => {
    expect(canonicals(seo({ ...base, path: '/store?sort=newest#top' }).links)[0]!.href).toBe(`${SITE_ORIGIN}/store`)
  })

  test('noindex has no canonical and a robots tag', () => {
    const { meta, links } = seo({ ...base, noindex: true })
    expect(canonicals(links)).toHaveLength(0)
    expect(metaValue(meta as never, 'robots')).toBe('noindex, follow')
  })

  test('indexable pages have no robots tag', () => {
    expect(metaValue(seo(base).meta as never, 'robots')).toBeUndefined()
  })

  test('title, Open Graph and Twitter tags', () => {
    const { meta } = seo({ ...base, type: 'product' })
    const m = meta as never
    expect(meta[0]).toEqual({ title: 'Night Drive | Organic Sonics' })
    expect(metaValue(m, 'description')).toBe('A dark drum kit.')
    expect(metaValue(m, 'og:title')).toBe('Night Drive | Organic Sonics')
    expect(metaValue(m, 'og:url')).toBe(`${SITE_ORIGIN}/store/night-drive`)
    expect(metaValue(m, 'og:type')).toBe('product')
    expect(metaValue(m, 'og:site_name')).toBe('Organic Sonics')
    expect(metaValue(m, 'twitter:card')).toBe('summary_large_image')
    expect(metaValue(m, 'twitter:title')).toBe('Night Drive | Organic Sonics')
    expect(metaValue(m, 'twitter:description')).toBe('A dark drum kit.')
  })

  test('defaults to the brand OG image with dimensions', () => {
    const m = seo(base).meta as never
    expect(metaValue(m, 'og:image')).toBe(`${SITE_ORIGIN}/og/default.png`)
    expect(metaValue(m, 'og:image:width')).toBe('1200')
    expect(metaValue(m, 'og:image:height')).toBe('630')
    expect(metaValue(m, 'twitter:image')).toBe(`${SITE_ORIGIN}/og/default.png`)
  })

  test('relative images become absolute; absolute images pass through', () => {
    const rel = seo({ ...base, image: { url: '/img/a.png', alt: 'A' } }).meta as never
    expect(metaValue(rel, 'og:image')).toBe(`${SITE_ORIGIN}/img/a.png`)
    expect(metaValue(rel, 'og:image:alt')).toBe('A')
    const abs = seo({ ...base, image: { url: 'https://cdn.shopify.com/x.png', width: 800, height: 800 } }).meta as never
    expect(metaValue(abs, 'og:image')).toBe('https://cdn.shopify.com/x.png')
    expect(metaValue(abs, 'og:image:width')).toBe('800')
  })

  test('image without dimensions emits no width or height', () => {
    const m = seo({ ...base, image: { url: 'https://cdn.shopify.com/x.png' } }).meta as never
    expect(metaValue(m, 'og:image:width')).toBeUndefined()
    expect(metaValue(m, 'og:image:height')).toBeUndefined()
  })

  test('home: no title gives the plain brand', () => {
    expect(seo({ description: 'd', path: '/' }).meta[0]).toEqual({ title: 'Organic Sonics' })
  })

  test('no meta key appears twice', () => {
    const keys = seo(base).meta.map((m) => ('name' in m ? m.name : 'property' in m ? m.property : 'title'))
    expect(new Set(keys).size).toBe(keys.length)
  })
})
