/**
 * Site-wide feature flags. Public and non-secret; anything other than the exact string 'true' is off.
 * Read straight from import.meta.env (statically replaced by Vite on both builds), the same pattern as
 * components/explore/explore-flags.ts.
 */

/**
 * Membership has no roadmap yet (decided 2026-10-28). Off by default: membership sections render as
 * "coming soon" promos (same copy and benefits, CTA points to the newsletter) and stray membership
 * mentions are reworded. On: the full membership pitch and join CTAs render as before.
 */
export const membershipEnabled = import.meta.env.VITE_MEMBERSHIP_ENABLED === 'true'
