'use client'

import { useEffect, useState } from 'react'
import { useDismissible } from '@/hooks/useDismissible'
import { parseDocBullets } from '@/lib/docs-help/parse'
import { BookText, Check, Sparkles, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { docsHelpEnabled } from '@repo/dally/ai'
import { Callout } from '@/components/shared/callout/callout'
import { useCreateControlObjective } from '@/lib/graphql-hooks/control-objective'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useControlDocsSection, type TDocsEvidenceControl } from '@/components/pages/protected/controls/example-evidence-requests'
import { useDocsHelpNavigate } from '@/components/shared/docs-help/docs-help-context'

function parseFirstObjective(section: string): { name: string; desiredOutcome: string } | null {
  const [first] = parseDocBullets(section)
  return first ? { name: first.label, desiredOutcome: first.description } : null
}

export type TSuggestedObjectiveData = {
  control: TDocsEvidenceControl
  suggestion: { name: string; desiredOutcome: string }
  target: { refCode: string; framework: string }
  dismissed: boolean
  dismiss: () => void
}

export function useSuggestedObjective(control?: TDocsEvidenceControl): TSuggestedObjectiveData | null {
  const { section, target } = useControlDocsSection(docsHelpEnabled ? control : undefined, 'Example Control Objectives')

  const { dismissed, dismiss } = useDismissible(`objective-suggestion-dismissed:${control?.controlId ?? ''}`)

  const suggestion = section ? parseFirstObjective(section) : null
  if (!docsHelpEnabled || !control || !suggestion || !target) return null
  return { control, suggestion, target, dismissed, dismiss }
}

export function SuggestedObjective({ data, fallback }: { data: TSuggestedObjectiveData | null; fallback?: React.ReactNode }) {
  const navigateDocs = useDocsHelpNavigate()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createObjective, isPending } = useCreateControlObjective()

  const suggestion = data?.suggestion ?? null
  const target = data?.target
  const control = data?.control
  const dismissed = data?.dismissed ?? false

  // editable copy so the user can adjust before creating
  const [name, setName] = useState('')
  const [desiredOutcome, setDesiredOutcome] = useState('')
  useEffect(() => {
    setName(suggestion?.name ?? '')
    setDesiredOutcome(suggestion?.desiredOutcome ?? '')
  }, [suggestion?.name, suggestion?.desiredOutcome])

  if (!suggestion || !target || !control || dismissed) return <>{fallback ?? null}</>

  const handleAccept = async () => {
    if (!name.trim()) return
    try {
      await createObjective({
        name: name.trim(),
        desiredOutcome: desiredOutcome.trim() || undefined,
        controlIDs: [control.controlId],
      })
      successNotification({ title: 'Objective created', description: `"${name.trim()}" was added to this control` })
    } catch (error) {
      errorNotification({ title: 'Failed to create objective', description: parseErrorMessage(error) })
    }
  }

  const handleDismiss = () => data?.dismiss()

  return (
    <Callout variant="recommendation" title={<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Suggested objective</span>}>
      <div className="mb-3 flex flex-col gap-2">
        <Input maxWidth value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Objective name" disabled={isPending} />
        <Textarea value={desiredOutcome} onChange={(e) => setDesiredOutcome(e.currentTarget.value)} placeholder="Desired outcome" rows={3} disabled={isPending} />
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        This control has no objective yet — this suggestion comes from the{' '}
        <button
          type="button"
          onClick={() =>
            navigateDocs({
              title: `${target.framework} ${target.refCode}`,
              query: `${target.framework} ${target.refCode}`,
              prefer: target.refCode,
            })
          }
          className="inline-flex items-center gap-1 text-[var(--color-info)] hover:underline underline-offset-4"
        >
          {target.framework} {target.refCode} docs
          <BookText size={11} />
        </button>
        .
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          icon={isPending ? <Sparkles className="animate-pulse" size={14} /> : <Check size={14} />}
          iconPosition="left"
          onClick={handleAccept}
          disabled={isPending || !name.trim()}
        >
          Accept
        </Button>
        <Button variant="outline" icon={<X size={14} />} iconPosition="left" onClick={handleDismiss} disabled={isPending}>
          Dismiss
        </Button>
      </div>
    </Callout>
  )
}
