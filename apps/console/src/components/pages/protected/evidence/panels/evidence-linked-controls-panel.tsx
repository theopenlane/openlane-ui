'use client'

import React, { useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { ControlSelectionDialog } from '@/components/shared/object-association/object-association-control-dialog'
import ObjectAssociationControlsChips from '@/components/shared/object-association/object-association-controls-chips'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { type SuggestedControl } from '@/components/pages/protected/evidence/hooks/use-evidence-suggested-controls'
import { type CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'

type TEvidenceLinkedControlsPanelProps = {
  form: CreateEvidenceFormMethods
  evidenceControls: CustomEvidenceControl[] | null
  setEvidenceControls: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  evidenceSubcontrols: CustomEvidenceControl[] | null
  setEvidenceSubcontrols: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  suggestedControlsMap?: SuggestedControl[]
  isLoadingSuggestions?: boolean
  showEmptyState?: boolean
}

const EvidenceLinkedControlsPanel: React.FC<TEvidenceLinkedControlsPanelProps> = ({
  form,
  evidenceControls,
  setEvidenceControls,
  evidenceSubcontrols,
  setEvidenceSubcontrols,
  suggestedControlsMap,
  isLoadingSuggestions,
  showEmptyState = false,
}) => {
  const [openControlsDialog, setOpenControlsDialog] = useState(false)
  const linkedCount = (form.watch('subcontrolIDs')?.length || 0) + (form.watch('controlIDs')?.length || 0)

  return (
    <>
      {showEmptyState && linkedCount === 0 && (
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck size={18} className="text-accent-secondary" />
          <div>
            <p className="text-sm font-medium">No controls linked yet</p>
            <p className="text-xs text-muted-foreground">Link at least one control to help track and organize this evidence.</p>
          </div>
        </div>
      )}
      <Accordion type="single" collapsible defaultValue="ControlsAccordion" className="w-full">
        <AccordionItem value="ControlsAccordion">
          <div className="flex items-center justify-between w-full">
            <RelationsAccordionTrigger label="Linked Control(s)" count={linkedCount} />
            <Button
              variant="secondary"
              type="button"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                setOpenControlsDialog(true)
              }}
              icon={<Plus />}
              iconPosition="left"
            >
              Add Controls
            </Button>
          </div>

          <AccordionContent>
            <div className="mt-5 flex flex-col gap-5">
              <ObjectAssociationControlsChips
                form={form}
                suggestedControlsMap={suggestedControlsMap}
                isLoadingSuggestions={isLoadingSuggestions}
                evidenceControls={evidenceControls}
                setEvidenceControls={setEvidenceControls}
                evidenceSubcontrols={evidenceSubcontrols}
                setEvidenceSubcontrols={setEvidenceSubcontrols}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <ControlSelectionDialog
        open={openControlsDialog}
        onClose={() => setOpenControlsDialog(false)}
        form={form}
        evidenceControls={evidenceControls}
        setEvidenceControls={setEvidenceControls}
        evidenceSubcontrols={evidenceSubcontrols}
        setEvidenceSubcontrols={setEvidenceSubcontrols}
      />
    </>
  )
}

export default EvidenceLinkedControlsPanel
