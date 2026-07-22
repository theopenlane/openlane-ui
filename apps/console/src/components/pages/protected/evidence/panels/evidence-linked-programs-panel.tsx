'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { ProgramSelectionDialog } from '@/components/shared/object-association/object-association-programs-dialog'
import ObjectAssociationProgramsChips from '@/components/shared/object-association/object-association-programs-chips'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'

type TEvidenceLinkedProgramsPanelProps = {
  form: CreateEvidenceFormMethods
  refMap: string[]
  setRefMap: React.Dispatch<React.SetStateAction<string[]>>
}

const EvidenceLinkedProgramsPanel: React.FC<TEvidenceLinkedProgramsPanelProps> = ({ form, refMap, setRefMap }) => {
  const [openProgramsDialog, setOpenProgramsDialog] = useState(false)
  const programIDs = form.watch('programIDs')
  const accordionValue = (programIDs?.length || 0) > 0 ? 'ProgramsAccordion' : undefined

  const handleSavePrograms = (newIds: string[], newRefCodes: string[]) => {
    setRefMap(newRefCodes || [])
    form.setValue('programIDs', newIds)
  }

  return (
    <>
      <Accordion type="single" collapsible value={accordionValue} className="w-full">
        <AccordionItem value="ProgramsAccordion">
          <div className="flex items-center justify-between w-full">
            <RelationsAccordionTrigger label="Linked Program(s)" count={programIDs?.length || 0} />

            <Button
              variant="secondary"
              className="py-5"
              onClick={(e) => {
                e.stopPropagation()
                setOpenProgramsDialog(true)
              }}
              type="button"
              icon={<Plus />}
              iconPosition="left"
            >
              Add Programs
            </Button>
          </div>

          <AccordionContent>
            <div className="mt-5 flex flex-col gap-5">
              <ObjectAssociationProgramsChips form={form} refMap={refMap} setRefMap={setRefMap} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ProgramSelectionDialog form={form} open={openProgramsDialog} onClose={() => setOpenProgramsDialog(false)} initialRefCodes={refMap} onSave={handleSavePrograms} />
    </>
  )
}

export default EvidenceLinkedProgramsPanel
