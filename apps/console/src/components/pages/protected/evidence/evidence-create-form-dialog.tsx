import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { FilePlus } from 'lucide-react'

type TProps = {
  taskData?: { taskId: string; displayID: string; tags?: string[] }
}

const EvidenceCreateFormDialog: React.FC<TProps> = (props: TProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

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
          <DialogTitle>Submit Evidence for </DialogTitle>
        </DialogHeader>
        <EvidenceCreateForm taskData={props.taskData} onEvidenceCreateSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceCreateFormDialog
