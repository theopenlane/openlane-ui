'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { LightbulbIcon, Link2, Loader2 } from 'lucide-react'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useSuggestedPolicies } from '@/components/pages/protected/controls/suggested-policies'
import { SuggestionRow } from '@/components/shared/docs-help/suggestion-card'
import { type TDocsEvidenceControl } from '@/components/pages/protected/controls/example-evidence-requests'

export function MapSuggestedPoliciesButton({ control, size }: { control: TDocsEvidenceControl; size?: 'sm' }) {
  const [open, setOpen] = useState(false)
  const data = useSuggestedPolicies(control)

  const mappable = (data?.suggestions ?? []).flatMap((suggestion) => (suggestion.existingPolicy ? [{ ...suggestion, existingPolicy: suggestion.existingPolicy }] : []))

  if (!docsHelpEnabled || !data || data.dismissed || mappable.length === 0) return null

  return (
    <>
      <Button
        variant="secondary"
        icon={<LightbulbIcon size={size === 'sm' ? 12 : 16} />}
        iconPosition="left"
        className={size === 'sm' ? 'h-6 max-w-full px-2 text-xs whitespace-nowrap' : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        Map Policies
      </Button>
      <MapSuggestedPoliciesDialog open={open} onOpenChange={setOpen} controlId={data.controlId} target={data.target} suggestions={mappable} />
    </>
  )
}

type TMappablePolicy = { name: string; description: string; existingPolicy: { id: string; name: string } }

function MapSuggestedPoliciesDialog({
  open,
  onOpenChange,
  controlId,
  target,
  suggestions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  controlId: string
  target: { refCode: string; framework: string }
  suggestions: TMappablePolicy[]
}) {
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)

  const mapPolicies = async (policies: Array<{ id: string; name: string }>) => {
    setBusy(policies.length === 1 ? policies[0].id : 'all')
    try {
      for (const policy of policies) {
        await updatePolicy({ updateInternalPolicyId: policy.id, input: { addControlIDs: [controlId] } })
      }
      successNotification({
        title: `Mapped ${policies.length} polic${policies.length === 1 ? 'y' : 'ies'}`,
        description: `Now linked to ${target.framework} ${target.refCode}`,
      })
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['controls', 'report'] })
    } catch (error) {
      errorNotification({ title: 'Failed to map policies', description: parseErrorMessage(error) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-6">
            Map policies to {target.framework} {target.refCode}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">The docs recommend these policies for this control, and your organization already has them — they just aren&apos;t linked yet.</p>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {suggestions.map((suggestion) => (
            <SuggestionRow
              key={suggestion.existingPolicy.id}
              title={suggestion.existingPolicy.name}
              description={suggestion.description}
              action={
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => mapPolicies([suggestion.existingPolicy])}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4 disabled:opacity-50"
                >
                  <Link2 size={14} />
                  Map
                </button>
              }
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy !== null}>
            Cancel
          </Button>
          <Button
            onClick={() => mapPolicies(suggestions.map((suggestion) => suggestion.existingPolicy))}
            disabled={busy !== null}
            icon={busy !== null ? <Loader2 className="animate-spin" /> : undefined}
            iconPosition="left"
          >
            Map {suggestions.length} polic{suggestions.length === 1 ? 'y' : 'ies'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
