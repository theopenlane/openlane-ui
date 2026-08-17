'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Globe, Loader2, Sparkles } from 'lucide-react'
import { type Value } from 'platejs'
import { docsHelpEnabled } from '@repo/dally/ai'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useGetControlById, useUpdateControl } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolById, useUpdateSubcontrol } from '@/lib/graphql-hooks/subcontrol'
import { useGetAllControlImplementations } from '@/lib/graphql-hooks/control-implementation'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objective'
import { controlAssociationFilter } from '@/lib/graphql-hooks/control-association'
import { ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { useSuggestPublicRepresentation } from '@/hooks/useDocsHelp'
import { useNotification } from '@/hooks/useNotification'
import { Callout } from '@/components/shared/callout/callout'
import ControlContextPanel from '@/components/pages/protected/controls/control-context-panel'

type PublicRepresentationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  controlId: string
  subcontrolId?: string
}

const PublicRepresentationDialog: React.FC<PublicRepresentationDialogProps> = ({ open, onOpenChange, controlId, subcontrolId }) => {
  const isSubcontrol = !!subcontrolId
  const { convertToHtml } = usePlateEditor()
  const { successNotification, errorNotification } = useNotification()

  const { data: controlData } = useGetControlById(isSubcontrol ? null : controlId)
  const { data: subcontrolData } = useGetSubcontrolById(subcontrolId ?? null)
  const record = isSubcontrol ? subcontrolData?.subcontrol : controlData?.control

  const association = controlAssociationFilter(controlId, subcontrolId)
  const { data: implementationsData } = useGetAllControlImplementations(association)
  const { data: objectivesData } = useGetAllControlObjectives({ ...association, statusNEQ: ControlObjectiveObjectiveStatus.ARCHIVED })

  const { mutateAsync: updateControl, isPending: isSavingControl } = useUpdateControl()
  const { mutateAsync: updateSubcontrol, isPending: isSavingSubcontrol } = useUpdateSubcontrol()
  const { mutateAsync: suggest, isPending: isSuggesting } = useSuggestPublicRepresentation()

  const existing = record?.publicRepresentation ?? ''
  const [value, setValue] = useState<Value | string>(existing)
  const [draft, setDraft] = useState<string | null>(null)
  const [seeded, setSeeded] = useState(false)

  // seed once per opening, and only until the record has actually loaded, so a
  // refetch can't overwrite what the user has already typed
  useEffect(() => {
    if (!open) {
      setSeeded(false)
      return
    }
    if (seeded) return
    setValue(existing)
    setDraft(null)
    if (record) setSeeded(true)
  }, [open, existing, record, seeded])

  const handleSuggest = async () => {
    const implementations = (implementationsData?.controlImplementations?.edges ?? []).flatMap((edge) => (edge?.node?.details ? [edge.node.details] : []))
    const objectives = (objectivesData?.controlObjectives?.edges ?? []).flatMap((edge) => {
      const node = edge?.node
      if (!node) return []
      return [[node.name, node.desiredOutcome].filter(Boolean).join(' — ')]
    })

    try {
      const text = await suggest({
        refCode: record?.refCode ?? undefined,
        referenceFramework: record?.referenceFramework ?? undefined,
        description: record?.description ?? undefined,
        implementations,
        objectives,
        existing: typeof existing === 'string' ? existing : undefined,
      })
      if (!text) {
        errorNotification({ title: 'No suggestion', description: 'Could not draft public wording for this control. Please try again.' })
        return
      }
      setDraft(text)
      setValue(text)
    } catch {
      errorNotification({ title: 'Suggestion failed', description: 'Could not reach the suggestion service. Please try again.' })
    }
  }

  const handleSave = async () => {
    const publicRepresentation = typeof value === 'string' ? value : await convertToHtml(value)

    try {
      if (isSubcontrol) {
        await updateSubcontrol({ updateSubcontrolId: subcontrolId, input: { publicRepresentation } })
      } else {
        await updateControl({ updateControlId: controlId, input: { publicRepresentation } })
      }
      successNotification({ title: 'Public representation saved' })
      onOpenChange(false)
    } catch {
      errorNotification({ title: 'Save failed', description: 'Could not save the public representation. Please try again.' })
    }
  }

  const isSaving = isSavingControl || isSavingSubcontrol

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe size={18} />
            {record?.refCode ? `Public Representation of ${record.refCode}` : 'Public Representation'}
          </DialogTitle>
        </DialogHeader>

        <ControlContextPanel control={record} descriptionClassName="max-h-40 overflow-y-auto" hideHeader hideRefCode />

        <Callout variant="simple" compact contentClassName="text-xs">
          This is the public wording that could be shown to external users in places such as your Trust Center or questionnaire responses. Keep it free of internal detail.
        </Callout>
        {draft && (
          <Callout variant="recommendation" compact title="Drafted with AI">
            Review and edit this before saving. It is written from the control&apos;s description, implementations and objectives, and has not been checked by a human.
          </Callout>
        )}

        <PlateEditor key={draft ?? 'initial'} variant="minimal" initialValue={value} onChange={setValue} containerClassName="min-h-[150px]" placeholder="Write the public wording for this control" />

        <DialogFooter className="justify-between">
          {docsHelpEnabled && (
            <Button
              type="button"
              variant="secondary"
              icon={isSuggesting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              iconPosition="left"
              disabled={isSuggesting}
              onClick={handleSuggest}
            >
              {isSuggesting ? 'Drafting' : 'Suggest with AI'}
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleSave}>
              {isSaving ? 'Saving' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PublicRepresentationDialog
