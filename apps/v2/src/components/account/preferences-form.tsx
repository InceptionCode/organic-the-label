import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { mutationOptions, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FormAlert, SubmitButton, textButtonClasses } from '~/components/auth/form-bits'
import { updatePreferencesFn } from '~/fns/preferences.fn'
import { preferencesQueries } from '~/queries/preferences'
import type { NewsletterSyncStatus } from '~/server/preferences/newsletter-sync'
import {
  GENRE_OPTIONS,
  PREFERENCES_MESSAGES,
  PRODUCT_TYPE_OPTIONS,
  PreferencesSchema,
  type Preferences,
  type PreferencesInput,
} from '~/server/preferences/options'
import { Checkbox } from '~/ui/checkbox'
import { AccountCard } from './account-card'

function updatePreferencesMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ['account', 'preferences', 'update'],
    mutationFn: (input: PreferencesInput) => updatePreferencesFn({ data: input }),
    onSuccess: (saved) => queryClient.setQueryData(preferencesQueries.current().queryKey, saved.preferences),
  })
}

type Status = { tone: 'success' | 'error'; message: string; newsletterLink?: boolean } | null

function savedStatus(newsletter: NewsletterSyncStatus, wanted: boolean): NonNullable<Status> {
  if (newsletter === 'subscribed') return { tone: 'success', message: PREFERENCES_MESSAGES.savedSubscribed }
  if (newsletter === 'unsubscribed') return { tone: 'success', message: PREFERENCES_MESSAGES.savedUnsubscribed }
  if (newsletter === 'unverified') return { tone: 'success', message: PREFERENCES_MESSAGES.savedUnverified }
  if (newsletter === 'failed') {
    return wanted
      ? { tone: 'success', message: PREFERENCES_MESSAGES.savedNewsletterFailed, newsletterLink: true }
      : { tone: 'success', message: PREFERENCES_MESSAGES.savedUnsubscribeFailed }
  }
  return { tone: 'success', message: PREFERENCES_MESSAGES.saved }
}

/** Reads the native form: repeated checkbox names become arrays, the two opt-ins become booleans. */
function readForm(form: HTMLFormElement) {
  const data = new FormData(form)
  return PreferencesSchema.safeParse({
    favoriteGenres: data.getAll('favoriteGenres'),
    favoriteProductTypes: data.getAll('favoriteProductTypes'),
    marketingOptIn: data.get('marketingOptIn') === 'on',
    personalizationOptIn: data.get('personalizationOptIn') === 'on',
  })
}

export function PreferencesForm({ preferences, emailVerified }: { preferences: Preferences; emailVerified: boolean }) {
  const queryClient = useQueryClient()
  const save = useMutation(updatePreferencesMutation(queryClient))
  const [status, setStatus] = useState<Status>(null)
  // Bumped per successful save to remount the newsletter box from the returned real state.
  const [saves, setSaves] = useState(0)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = readForm(event.currentTarget)
    if (!parsed.success) return setStatus({ tone: 'error', message: PREFERENCES_MESSAGES.invalid })
    setStatus(null)
    save.mutate(parsed.data, {
      onSuccess: (saved) => {
        setStatus(savedStatus(saved.newsletter, parsed.data.marketingOptIn))
        setSaves((n) => n + 1)
      },
      onError: () => setStatus({ tone: 'error', message: PREFERENCES_MESSAGES.generic }),
    })
  }

  return (
    <AccountCard title="Preferences">
      <p className="mb-6 max-w-[60ch] text-body-m text-secondary">
        Tell us what you make so the store and your recommendations start with the right sounds.
      </p>
      <form method="post" onSubmit={onSubmit} onChange={() => setStatus(null)} noValidate>
        <div className="border-b border-[color:var(--border-subtle)]">
          <OptionGroup label="Genres">
            {GENRE_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                name="favoriteGenres"
                value={option.value}
                defaultChecked={preferences.favoriteGenres.includes(option.value)}
              >
                <span className="text-body-m text-primary">{option.label}</span>
              </Checkbox>
            ))}
          </OptionGroup>
          <OptionGroup label="Product types">
            {PRODUCT_TYPE_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                name="favoriteProductTypes"
                value={option.value}
                defaultChecked={preferences.favoriteProductTypes.includes(option.value)}
              >
                <span className="text-body-m text-primary">{option.label}</span>
              </Checkbox>
            ))}
          </OptionGroup>
          <OptionGroup label="Email and recommendations" stacked>
            <Checkbox
              key={saves}
              name="marketingOptIn"
              defaultChecked={preferences.marketingOptIn}
              disabled={!emailVerified}
              className="disabled:cursor-not-allowed disabled:opacity-50"
              labelClassName={emailVerified ? undefined : 'cursor-not-allowed'}
            >
              <span className="block text-body-m text-primary">Email me about new drops and offers</span>
              <span className="block text-body-s text-muted">
                {emailVerified ? PREFERENCES_MESSAGES.newsletterHelp : PREFERENCES_MESSAGES.newsletterUnverified}
              </span>
            </Checkbox>
            <Checkbox name="personalizationOptIn" defaultChecked={preferences.personalizationOptIn}>
              <span className="block text-body-m text-primary">Personalize my recommendations</span>
              <span className="block text-body-s text-muted">Use what I browse and play here to suggest sounds. Only used to personalize and improve the site, never shared with third parties.</span>
            </Checkbox>
          </OptionGroup>
        </div>

        <div className="mt-6 empty:hidden" aria-live="polite">
          {status ? (
            <FormAlert tone={status.tone}>
              {status.message}
              {status.newsletterLink ? (
                <>
                  {' '}
                  <Link to="/newsletter" className={textButtonClasses('link', 'min-h-0 px-0 align-baseline')}>
                    {PREFERENCES_MESSAGES.savedNewsletterFailedLink}
                  </Link>
                  .
                </>
              ) : null}
            </FormAlert>
          ) : null}
        </div>
        <SubmitButton pending={save.isPending} className="mt-6 sm:max-w-xs">
          Save preferences
        </SubmitButton>
      </form>
    </AccountCard>
  )
}

/** One hairline row: the group label in a 10rem column (like the Profile list), options beside it. */
function OptionGroup({ label, stacked = false, children }: { label: string; stacked?: boolean; children: ReactNode }) {
  const id = useId()
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="grid gap-3 border-t border-[color:var(--border-subtle)] py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
    >
      <p id={id} className="text-label sm:pt-2.5">
        {label}
      </p>
      <div className={stacked ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3'}>{children}</div>
    </div>
  )
}
