import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { FilePlus } from 'lucide-react'
import { dialogStyles } from '@/components/pages/protected/program/dialog.styles.tsx'
import { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { useParams, usePathname } from 'next/navigation'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'

type TProps = {
  formData?: TFormEvidenceData
}

const EvidenceCreateFormDialog: React.FC<TProps> = (props: TProps) => {
  const path = usePathname()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { formInput } = dialogStyles()

  const isControl = path.startsWith('/controls')

  const { id } = useParams<{ id: string }>()
  const { data: controlData } = useGetControlById(isControl ? id : null)

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
        title: `Submit Evidence for Control ${controlData?.control?.refCode}`,
      }
    }
    if (props.formData) {
      return {
        button: (
          <Button icon={<FilePlus />} iconPosition="left" onClick={() => setIsOpen(true)}>
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
  }, [path])

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
            excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.RISK, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY]}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceCreateFormDialog
