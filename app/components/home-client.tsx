"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-components';
import useSafeParseUser from '@/utils/hooks/use-safe-parse-user';
import { useStorage } from '@/utils/hooks/use-storage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { defaultUserState } from '@/lib/store/auth-store';
import { useTrackingReady } from '@/store/activity-hydrator';
import { STORE_CATEGORIES } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { RevealSection } from '@/app/components/reveal-section';

const AuroraWaves = dynamic(() => import('@/ui-components/aurora-waves'), { ssr: false });

const MEMBERSHIP_BENEFITS = [
  'Exclusive samples & kits not in the public store',
  'Reward points on every purchase',
  'Early access to new drops & limited releases',
  'Educational videos & production tips',
  'Member-only discounts and deals',
  'Free resources, event reminders & announcements',
];

type HomeClientProps = {
  featuredSection?: React.ReactNode;
};

export default function HomeClient({ featuredSection }: HomeClientProps) {
  const router = useRouter();
  const user = useSafeParseUser(defaultUserState);
  const isTrackingReady = useTrackingReady();

  const { setStorage, initItem: initCTAFlag } = useStorage('session', 'showSignUpCTA', {
    initMethod: 'get',
    item: 'true',
  });

  // Derive open state — no extra effect needed, avoids setState-in-effect lint warning
  const shouldShowCTA = initCTAFlag === 'true' && (!user || user?.is_anon);
  const [dismissed, setDismissed] = useState(false);
  const open = shouldShowCTA && !dismissed;

  const onConfirm = () => {
    router.push('/signup');
    setDismissed(true);
    setStorage('session', 'showSignUpCTA', 'false');
  };

  const onClose = () => {
    setDismissed(true);
    setStorage('session', 'showSignUpCTA', 'false');
  };

  useEffect(() => {
    if (isTrackingReady) {
      trackActivity({ eventType: 'homepage_viewed' });
    }
  }, [isTrackingReady]);

  return (
    <>
      {/* ── Sign-up modal ── */}
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}
            >
              ✦
            </div>
            <DialogTitle className="text-h3">Start Free Membership</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-body-m text-black">
            Sign up and receive exclusive content, discounts, and early access from Organic Sonics.
          </DialogDescription>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" onClick={onClose}>
                Maybe later
              </Button>
            </DialogClose>
            <Button onClick={onConfirm}>Join free</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        className="relative min-h-[93vh] flex items-center overflow-hidden"
        style={{ background: 'var(--bg-canvas)' }}
      >
        {/* Aurora WebGL background — fills the section absolutely */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <AuroraWaves speed={0.40} glow={22} resolutionScale={0.7} />
        </div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(23,23,23,0.85) 0%, rgba(23,23,23,0.50) 55%, rgba(23,23,23,0.18) 100%)',
          }}
        />

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
          }}
        />

        <div className="relative z-10 content-container py-28 md:py-36">
          <p
            className="eyebrow mb-6"
            style={{ color: 'var(--accent-secondary)', letterSpacing: '0.15em' }}
          >
            Organic Sonics · Premium Producer Store
          </p>

          <h1
            className="text-primary mb-8"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(3.5rem, 10vw, 9rem)',
              letterSpacing: '0.02em',
              lineHeight: 1.0,
              maxWidth: '16ch',
            }}
          >
            <span className="block">PREMIUM SOUNDS</span>
            <span className="block" style={{ color: 'var(--accent-primary)' }}>FOR MODERN</span>
            <span className="block">PRODUCERS</span>
          </h1>

          <p className="text-body-l text-secondary max-w-lg mb-12">
            Curated beats, kits, packs, sound banks, and resources built for serious creators.
            Elevate your sound. Express what’s real - <strong>Organic Sonics</strong>.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/store">Browse Kits</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">Join Free</Link>
            </Button>
          </div>
        </div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(to right, transparent 0%, var(--accent-primary) 40%, var(--accent-primary) 60%, transparent 100%)',
            opacity: 0.4,
          }}
        />
      </section>

      {featuredSection && (
        <RevealSection threshold={0.08} distance={32}>
          {featuredSection}
        </RevealSection>
      )}

      <RevealSection threshold={0.08} distance={32}>
        <section
          className="section-y-standard"
          style={{ background: 'var(--bg-subtle)' }}
        >
          <div className="content-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="eyebrow mb-2">What we offer</p>
                <h2
                  className="text-primary"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  BROWSE BY TYPE
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link href="/store">View all →</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STORE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.category}
                  href={cat.href}
                  className="group card-base card-hover p-6 flex flex-col gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
                >
                  <div className="flex-1">
                    <p
                      className="text-primary mb-1"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.25rem',
                        letterSpacing: '0.025em',
                      }}
                    >
                      {cat.label}
                    </p>
                    <p className="text-body-s text-muted">{cat.description}</p>
                  </div>
                  <span
                    className="text-caption opacity-0 group-hover:opacity-100"
                    style={{
                      color: 'var(--accent-primary)',
                      transition: 'opacity var(--motion-medium) var(--ease-soft)',
                    }}
                  >
                    Browse →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection threshold={0.08} distance={32}>
        <section
          className="section-y-standard relative overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 100% 55%, rgba(224, 61, 42, 0.10) 0%, transparent 55%),
              var(--bg-canvas)
            `,
          }}
        >
          <div className="content-container">
            <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
              <div>
                <p className="eyebrow mb-4" style={{ color: 'var(--accent-primary)' }}>
                  Membership
                </p>
                <h2
                  className="text-primary mb-6"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  MORE THAN A STORE
                </h2>
                <p className="text-body-l text-secondary mb-10">
                  Free membership gets you inside access — exclusive resources, reward
                  points, and a community of serious producers.
                </p>
                <Button asChild size="lg">
                  <Link href="/signup">Start free — no card needed</Link>
                </Button>
              </div>

              <div className="flex flex-col">
                {MEMBERSHIP_BENEFITS.map((benefit, i) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-4 py-4"
                    style={{
                      borderBottom:
                        i < MEMBERSHIP_BENEFITS.length - 1
                          ? '1px solid var(--border-subtle)'
                          : 'none',
                    }}
                  >
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'var(--accent-primary-soft)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      ✓
                    </span>
                    <p className="text-body-m text-secondary">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection threshold={0.08} distance={32}>
        <EmailSignupSection />
      </RevealSection>
    </>
  );
}

/* ── Email signup section ─────────────────────────────────── */
function EmailSignupSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email.'); return; }
    // TODO: wire up to actual email list API
    setSubmitted(true);
  };

  return (
    <section
      className="py-24 relative"
      style={{
        background: 'var(--surface-1)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="content-container text-center flex flex-col items-center"
        style={{ maxWidth: '38rem', margin: '0 auto' }}
      >
        <p className="eyebrow mb-4" style={{ color: 'var(--accent-secondary)' }}>
          Stay in the loop
        </p>
        <h2
          className="text-primary mb-4"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          GET FREE RESOURCES
        </h2>
        <p className="text-body-m text-secondary mb-10 max-w-sm">
          Early access to new drops, free samples, and exclusive deals — straight to
          your inbox. No spam, ever.
        </p>

        {submitted ? (
          <div
            className="w-full rounded-lg px-6 py-5 text-center"
            style={{ background: 'var(--accent-primary-soft)', border: '1px solid var(--accent-primary)' }}
          >
            <p className="text-body-m font-medium" style={{ color: 'var(--accent-primary)' }}>
              You&apos;re in. Welcome to the community ✦
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3" noValidate>
            {error && (
              <p className="text-body-s text-left" style={{ color: 'var(--danger)' }} role="alert">
                {error}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-label="Your name"
                className="w-full px-4 py-3 rounded-md text-body-m bg-surface-2:invert dark:text-black text-primary placeholder:text-muted border border-subtle focus:border-[color:var(--border-focus)] focus:outline-none transition-soft"
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
                className="w-full px-4 py-3 rounded-md text-body-m bg-surface-2:invert dark:text-black text-primary placeholder:text-muted border border-subtle focus:border-[color:var(--border-focus)] focus:outline-none transition-soft"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Sign up for free
            </Button>
            <p className="text-caption text-muted">
              By signing up you agree to receive marketing emails from Organic Sonics. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
