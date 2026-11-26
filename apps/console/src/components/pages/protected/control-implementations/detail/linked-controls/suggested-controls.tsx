import React, { useRef, useState } from 'react'
import { Link2, Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { type MappedControlMappingType } from '@repo/codegen/src/schema'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { ControlHoverCard } from '@/components/shared/control-tooltip/control-tooltip'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { MappingIconMapper } from '@/components/shared/enum-mapper/map-control-enum'
import { Link } from '@/components/shared/link/link'
import { CUSTOM_STANDARD_FILTER_VALUE } from '@/components/shared/table-filter/custom-standard-filter'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { partitionByParent, type TSuggestedControl, type TSuggestionGroup } from '@/lib/query-hooks/use-suggest-controls'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'

type TSuggestedControlsProps = {
  controlImplementationId: string
  groups: TSuggestionGroup[]
  unlinked: TSuggestedControl[]
  linkedIds: ReadonlySet<string>
  onLinked: () => void
}

const suggestionHref = ({ id, parentControlId }: TSuggestedControl) =>
  parentControlId ? getHrefForObjectType('subcontrols', { id, controlId: parentControlId }) : getHrefForObjectType('controls', { id })

const MappingTypeLabel = ({ mappingType }: { mappingType: MappedControlMappingType }) => (
  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
    <span className="flex size-3 items-center justify-center" aria-hidden>
      {MappingIconMapper[mappingType] ?? null}
    </span>
    {getEnumLabel(mappingType)}
  </span>
)

type TSuggestionRowProps = {
  control: TSuggestedControl
  mappingType?: MappedControlMappingType
  isLinked: boolean
  isLinking: boolean
  onLink: () => void
}

const SuggestionRow = ({ control, mappingType, isLinked, isLinking, onLink }: TSuggestionRowProps) => {
  const { refCode, title, referenceFramework, parentControlId } = control
  const frameworkLabel = referenceFramework || CUSTOM_STANDARD_FILTER_VALUE

  return (
    <li className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 py-2 pr-4 text-sm', mappingType ? 'pl-10' : 'pl-4')}>
      <ControlHoverCard id={control.id} isSubcontrol={!!parentControlId}>
        <Link href={suggestionHref(control)} newTab className="shrink-0">
          {refCode}
        </Link>
      </ControlHoverCard>
      <span className="min-w-0 flex-1 basis-24 truncate" title={title ?? undefined}>
        {title}
      </span>
      {mappingType && <MappingTypeLabel mappingType={mappingType} />}
      <StandardChip referenceFramework={referenceFramework ?? undefined} />
      {isLinked ? (
        <span className="w-16 shrink-0 text-center text-xs text-muted-foreground">Linked</span>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="h-8 w-16 shrink-0 px-3"
          icon={<Plus size={16} />}
          iconPosition="left"
          aria-label={`Link ${refCode} (${frameworkLabel})`}
          onClick={onLink}
          disabled={isLinking}
        >
          Link
        </Button>
      )}
    </li>
  )
}

export const SuggestedControls: React.FC<TSuggestedControlsProps> = ({ controlImplementationId, groups, unlinked, linkedIds, onLinked }) => {
  const claimedIdsRef = useRef(new Set<string>())
  const [claimedIds, setClaimedIds] = useState<ReadonlySet<string>>(() => new Set())
  const { mutateAsync: updateImplementation } = useUpdateControlImplementation()
  const { successNotification, errorNotification } = useNotification()

  const linkControls = async (controls: TSuggestedControl[]) => {
    const pending = controls.filter(({ id }) => !linkedIds.has(id) && !claimedIdsRef.current.has(id))
    if (!pending.length) return
    pending.forEach(({ id }) => claimedIdsRef.current.add(id))
    setClaimedIds(new Set(claimedIdsRef.current))

    const { controlIds: addControlIDs, subcontrolIds: addSubcontrolIDs } = partitionByParent(pending)
    const [first] = pending
    try {
      await updateImplementation({
        updateControlImplementationId: controlImplementationId,
        input: { ...(addControlIDs.length ? { addControlIDs } : {}), ...(addSubcontrolIDs.length ? { addSubcontrolIDs } : {}) },
      })
      successNotification(
        pending.length === 1
          ? { title: 'Control linked', description: `${first.refCode} is now linked to this implementation` }
          : { title: 'Controls linked', description: `${pluralizeWithCount(pending.length, 'control')} are now linked to this implementation` },
      )
      onLinked()
    } catch (error) {
      pending.forEach(({ id }) => claimedIdsRef.current.delete(id))
      setClaimedIds(new Set(claimedIdsRef.current))
      errorNotification({ title: 'Failed to link controls', description: parseErrorMessage(error) })
    }
  }

  const linkable = unlinked.filter(({ id }) => !claimedIds.has(id))

  return (
    <div className="space-y-2">
      {linkable.length > 1 && (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" icon={<Link2 size={16} />} iconPosition="left" onClick={() => linkControls(linkable)}>
            Link all ({linkable.length})
          </Button>
        </div>
      )}
      <ul className="divide-y rounded-lg border">
        {groups.map(({ control, mapped }) => (
          <li key={control.id}>
            <ul className="divide-y divide-dashed">
              <SuggestionRow control={control} isLinked={linkedIds.has(control.id)} isLinking={claimedIds.has(control.id)} onLink={() => linkControls([control])} />
              {mapped.map((mappedControl) => (
                <SuggestionRow
                  key={mappedControl.id}
                  control={mappedControl}
                  mappingType={mappedControl.mappingType}
                  isLinked={linkedIds.has(mappedControl.id)}
                  isLinking={claimedIds.has(mappedControl.id)}
                  onLink={() => linkControls([mappedControl])}
                />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
