import { SplitFormPage } from '~/components/forms/split-form-page'
import type { FreeResourcePublic } from '~/server/free-resources/get'
import { FreeResourceForm } from './free-resource-form'
import { freeResourceHeadline, freeResourceIntro } from './free-resource-hero'
import { INCLUDES_NOTE, freeResourcePoints } from './free-resource-includes'

/**
 * One view for /free and /free/$slug on the shared split layout (design-direction.md "Forms"):
 * headline, description and "What's inside" on the left, the request form on the right; below lg
 * the form comes before the list. `null` renders the default starter kit copy.
 */
export function FreeResourceView({ resource }: { resource: FreeResourcePublic | null }) {
  return (
    <SplitFormPage
      title={freeResourceHeadline(resource)}
      intro={<p>{freeResourceIntro(resource)}</p>}
      pointsHeading="What's inside"
      points={freeResourcePoints(resource?.includes)}
      note={INCLUDES_NOTE}
    >
      <FreeResourceForm key={resource?.slug ?? 'starter-kit'} resourceSlug={resource?.slug ?? 'starter-kit'} />
    </SplitFormPage>
  )
}
