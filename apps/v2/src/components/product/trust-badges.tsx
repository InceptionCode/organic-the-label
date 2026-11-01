import { Lock, Mail, Zap, type LucideIcon } from 'lucide-react'

const BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: Zap, label: 'Instant download' },
  { icon: Lock, label: 'Secure checkout' },
  { icon: Mail, label: 'Email delivery' },
]

/** One plain line: line icons and text, no pills. */
export function TrustBadges() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Purchase details">
      {BADGES.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-label">
          <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  )
}
