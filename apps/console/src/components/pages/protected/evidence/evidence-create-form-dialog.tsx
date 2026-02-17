import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { FilePlus } from 'lucide-react'
import { dialogStyles } from '@/components/pages/protected/programs/dialog.styles'
import { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config.ts'
import { CreateButton } from '@/components/shared/create-button/create-button'

type TProps = {
  formData?: TFormEvidenceData
  excludeObjectTypes?: ObjectTypeObjects[]
  createButton?: boolean
  defaultSelectedObject?: ObjectTypeObjects
}

const EvidenceCreateFormDialog: React.FC<TProps> = (props: TProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { formInput } = dialogStyles()

  const handleSuccess = () => {
    setIsOpen(false)
  }

  const config = useMemo(() => {
    if (props.createButton)
      return {
        button: <CreateButton type="evidence" onClick={() => setIsOpen(true)} />,
        title: props.formData?.displayID ? `Submit Evidence for ${props.formData?.displayID}` : '',
      }
    if (props.formData) {
      return {
        button: (
          <Button className="h-8 !px-2" icon={<FilePlus />} iconPosition="left" onClick={() => setIsOpen(true)}>
            Upload File
          </Button>
        ),
        title: `Submit Evidence for ${props.formData?.displayID}`,
      }
    }

    return {
      button: (
        <Button icon={<FilePlus />} iconPosition="left" onClick={() => setIsOpen(true)}>
          Upload File
        </Button>
      ),
    }
  }, [props.formData, props.createButton])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{config.button}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>
        <div className={formInput()}>
          <EvidenceCreateForm
            formData={props.formData}
            onEvidenceCreateSuccess={handleSuccess}
            excludeObjectTypes={props.excludeObjectTypes ?? []}
            defaultSelectedObject={props.defaultSelectedObject}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceCreateFormDialog
