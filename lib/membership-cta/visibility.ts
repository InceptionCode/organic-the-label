import { MEMBERSHIP_CTA_DISMISSED } from './constants';

type CookieStore = { get(name: string): { value: string } | undefined };

export function checkMembershipCtaVisibility(cookieStore: CookieStore): boolean {
  const value = cookieStore.get(MEMBERSHIP_CTA_DISMISSED)?.value;
  return !value;
}
