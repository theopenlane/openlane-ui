'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { ProgramSelectionDialog } from '@/components/shared/object-association/object-association-programs-dialog'
import ObjectAssociationProgramsChips from '@/components/shared/object-association/object-association-programs-chips'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { type TLinkedProgram } from '@/components/shared/object-association/types/object-association-types'

type TEvidenceLinkedProgramsPanelProps = {
  form: CreateEvidenceFormMethods
  linkedPrograms: TLinkedProgram[]
  setLinkedPrograms: React.Dispatch<React.SetStateAction<TLinkedProgram[]>>
}

const EvidenceLinkedProgramsPanel: React.FC<TEvidenceLinkedProgramsPanelProps> = ({ form, linkedPrograms, setLinkedPrograms }) => {
  const [openProgramsDialog, setOpenProgramsDialog] = useState(false)

  const handleProgramsChange = (programs: TLinkedProgram[]) => {
    setLinkedPrograms(programs)
    form.setValue(
      'programIDs',
      programs.map((program) => program.id),
      { shouldValidate: true, shouldDirty: true },
    )
  }

  return (
    <>
      <Accordion type="single" collapsible defaultValue="ProgramsAccordion" className="w-full">
        <AccordionItem value="ProgramsAccordion">
          <div className="flex items-center justify-between gap-3 w-full">
            <RelationsAccordionTrigger label="Linked Program(s)" count={linkedPrograms.length} />

            <Button
              variant="secondary"
              className="shrink-0"
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
              <ObjectAssociationProgramsChips programs={linkedPrograms} onChange={handleProgramsChange} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ProgramSelectionDialog open={openProgramsDialog} onClose={() => setOpenProgramsDialog(false)} initialPrograms={linkedPrograms} onSave={handleProgramsChange} />
    </>
  )
}

export default EvidenceLinkedProgramsPanel
