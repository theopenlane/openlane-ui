import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { FilePlus } from 'lucide-react'
import { dialogStyles } from '@/components/pages/protected/program/dialog.styles.tsx'
import { TTaskDataEvidence } from '@/components/pages/protected/evidence/types/TTaskDataEvidence.ts'

type TProps = {
  taskData?: TTaskDataEvidence
}

const EvidenceCreateFormDialog: React.FC<TProps> = (props: TProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { formInput } = dialogStyles()

  const handleSuccess = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<FilePlus />} iconPosition="left" onClick={() => setIsOpen(true)}>
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Evidence for {props.taskData?.displayID}</DialogTitle>
        </DialogHeader>
        <div className={formInput()}>
          <EvidenceCreateForm taskData={props.taskData} onEvidenceCreateSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceCreateFormDialog
