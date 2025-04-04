import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { FilePlus } from 'lucide-react'
import { dialogStyles } from '@/components/pages/protected/program/dialog.styles.tsx'
import { TTaskDataEvidence } from '@/components/pages/protected/evidence/types/TTaskDataEvidence.ts'
import { usePathname } from 'next/navigation'

type TProps = {
  taskData?: TTaskDataEvidence
}

const EvidenceCreateFormDialog: React.FC<TProps> = (props: TProps) => {
  const path = usePathname()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { formInput } = dialogStyles()

  const handleSuccess = () => {
    setIsOpen(false)
  }

  const config = useMemo(() => {
    if (path.startsWith('/controls')) {
      return {
        button: (
          <Button className="h-8 !px-2" onClick={() => setIsOpen(true)}>
            Upload Evidence
          </Button>
        ),
      }
    }
    return {
      button: (
        <Button icon={<FilePlus />} iconPosition="left" onClick={() => setIsOpen(true)}>
          Upload File
        </Button>
      ),
    }
  }, [path])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{config.button}</DialogTrigger>
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
