import { useId } from 'react'
import { FileCheckIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SearchableItemSelect, type SearchableItem } from '@/components/shared/searchable-item-select/searchable-item-select'
import { StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { toFrameworkTag } from '@/constants/standards'
import { formatList } from '@/utils/strings'

type TFrameworkContextFieldProps = {
  frameworks: SearchableItem[]
  isLoading: boolean
  isError: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  selectedFrameworks: SearchableItem[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
}

const frameworkIcon = (framework: SearchableItem) => (
  <span className="inline-flex">
    <StandardsHexagon shortName={framework.name} />
  </span>
)

const getDisabledReason = (isLoading: boolean, isError: boolean, frameworkCount: number) => {
  if (isLoading) return "Loading your organization's frameworks..."
  if (isError) return "Couldn't load your organization's frameworks. Please try again later."
  if (frameworkCount === 0) return 'Your organization has no frameworks yet. Add one from the Standards Catalog.'
  return undefined
}

export const FrameworkContextField = ({ frameworks, isLoading, isError, checked, onCheckedChange, selectedFrameworks, selectedIds, onSelectedIdsChange }: TFrameworkContextFieldProps) => {
  const switchId = useId()
  const descriptionId = useId()
  const pickerId = useId()
  const disabledReason = getDisabledReason(isLoading, isError, frameworks.length)
  const isOn = checked && !disabledReason
  const allSelected = selectedFrameworks.length === frameworks.length
  const frameworkTags = selectedFrameworks.map((framework) => toFrameworkTag(framework.name))

  return (
    <div className="flex gap-3 rounded-lg border p-4">
      <FileCheckIcon size={16} className="mt-0.5 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <label htmlFor={switchId} className="text-sm font-medium">
              Generate for a framework <span className="opacity-60">(optional)</span>
            </label>
            <p id={descriptionId} className="text-sm opacity-70">
              Use requirements from your organization&apos;s frameworks when generating this policy.
            </p>
          </div>
          <DisabledReasonTooltip reason={disabledReason}>
            <Switch id={switchId} aria-describedby={descriptionId} checked={isOn} onCheckedChange={onCheckedChange} disabled={!!disabledReason} />
          </DisabledReasonTooltip>
        </div>

        {isOn && (
          <div className="space-y-2">
            {frameworks.length === 1 ? (
              <>
                <p className="text-sm font-medium">Framework</p>
                <StandardChip referenceFramework={frameworks[0].name} />
                <p className="text-sm opacity-70">This is your organization&apos;s only framework.</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={pickerId} className="text-sm font-medium">
                    Frameworks
                  </label>
                  {!allSelected && (
                    <Button type="button" variant="link" className="text-blue-500" onClick={() => onSelectedIdsChange(frameworks.map((framework) => framework.id))}>
                      Select all
                    </Button>
                  )}
                </div>
                <SearchableItemSelect
                  id={pickerId}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={onSelectedIdsChange}
                  items={frameworks}
                  isLoading={false}
                  icon={frameworkIcon}
                  placeholder="Select frameworks..."
                  searchPlaceholder="Search frameworks..."
                  emptyMessage="No frameworks found."
                  filterItems
                  aria-invalid={selectedFrameworks.length === 0}
                />
              </>
            )}
            <p className="text-sm opacity-70">
              {frameworkTags.length > 0 ? `The policy will be tagged ${formatList(frameworkTags)} when you insert the generated draft.` : 'Select at least one framework to generate for.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
