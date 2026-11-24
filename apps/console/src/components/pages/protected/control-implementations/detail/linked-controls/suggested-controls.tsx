import React, { useRef, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@repo/ui/button'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { DismissButton } from '@/components/shared/docs-help/suggestion-card'
import { Link } from '@/components/shared/link/link'
import { CUSTOM_STANDARD_FILTER_VALUE } from '@/components/shared/table-filter/custom-standard-filter'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { type TSuggestedControl } from '@/lib/query-hooks/use-suggest-controls'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TSuggestedControlsProps = {
  controlImplementationId: string
  suggestions: TSuggestedControl[]
  onDismiss: () => void
}

export const SuggestedControls: React.FC<TSuggestedControlsProps> = ({ controlImplementationId, suggestions, onDismiss }) => {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const handledIdsRef = useRef(new Set<string>())
  const [handledIds, setHandledIds] = useState<readonly string[]>([])
  const { mutateAsync: updateImplementation } = useUpdateControlImplementation()
  const { successNotification, errorNotification } = useNotification()

  const syncHandledIds = () => setHandledIds([...handledIdsRef.current])

  const linkControl = async ({ id, refCode }: TSuggestedControl) => {
    if (handledIdsRef.current.has(id)) return
    handledIdsRef.current.add(id)
    syncHandledIds()
    try {
      await updateImplementation({ updateControlImplementationId: controlImplementationId, input: { addControlIDs: [id] } })
      successNotification({ title: 'Control linked', description: `${refCode} is now linked to this implementation` })
      headingRef.current?.focus()
    } catch (error) {
      handledIdsRef.current.delete(id)
      syncHandledIds()
      errorNotification({ title: 'Failed to link control', description: parseErrorMessage(error) })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-sm text-muted-foreground outline-hidden">
          <Sparkles size={16} />
          Suggested from the details
        </h3>
        <DismissButton onClick={onDismiss} label="Dismiss suggested controls" />
      </div>
      <ul className="divide-y rounded-lg border">
        {suggestions.map((suggestion) => {
          const { id, refCode, title, referenceFramework } = suggestion
          return (
            <li key={id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <Link href={getHrefForObjectType('controls', { id })} newTab className="shrink-0">
                {refCode}
              </Link>
              <span className="min-w-0 flex-1 truncate" title={title ?? undefined}>
                {title}
              </span>
              <StandardChip referenceFramework={referenceFramework ?? undefined} />
              <Button
                type="button"
                variant="secondary"
                className="h-8 shrink-0 px-3"
                icon={<Plus size={16} />}
                iconPosition="left"
                aria-label={`Link ${refCode} (${referenceFramework || CUSTOM_STANDARD_FILTER_VALUE})`}
                onClick={() => linkControl(suggestion)}
                disabled={handledIds.includes(id)}
              >
                Link
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
