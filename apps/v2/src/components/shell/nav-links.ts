export type NavLink = { name: string; to: string }

export const navLinks: NavLink[] = [
  { name: 'Explore', to: '/explore' },
  { name: 'Store', to: '/store' },
  { name: 'Compositions', to: '/compositions' },
  { name: 'Work With Me', to: '/work-with-me' },
]

export type FooterLink = { label: string; to: string; search?: Record<string, string> }

export const storeCategoryLinks: FooterLink[] = [
  { label: 'Drum Kits', to: '/store', search: { category: 'kit' } },
  { label: 'Beats', to: '/store', search: { category: 'beat' } },
  { label: 'Sample Packs', to: '/store', search: { category: 'pack' } },
  { label: 'Sound Banks', to: '/store', search: { category: 'bank' } },
  { label: 'VSTs & Plugins', to: '/store', search: { category: 'plugin' } },
  { label: 'Suites', to: '/store', search: { category: 'suite' } },
  { label: 'Merchandise', to: '/store', search: { category: 'merch' } },
  { label: 'Free', to: '/store', search: { tags: 'free' } },
]

export const companyLinks: FooterLink[] = [
  { label: 'About', to: '/about' },
  { label: 'Work With Me', to: '/work-with-me' },
  { label: 'Explore', to: '/explore' },
  { label: 'Contact', to: '/contact' },
  { label: 'Search', to: '/search' },
]

export const accountLinks: FooterLink[] = [
  { label: 'Sign up', to: '/signup' },
  { label: 'Log in', to: '/login' },
  { label: 'My account', to: '/account' },
]
