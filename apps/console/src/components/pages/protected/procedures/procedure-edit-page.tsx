import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'
import { useForm } from 'react-hook-form'
import { ProcedureEditSidebar } from './procedure-edit-sidebar'
import { ProcedureByIdFragment, useGetProcedureDetailsByIdQuery, useUpdateProcedureMutation } from '@repo/codegen/src/schema'
import { useEffect, useMemo, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditProcedureSchema, EditProcedureFormData } from './procedure-edit-form-types'
import type { Value } from '@udecode/plate-common'
import { Button } from '@repo/ui/button'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGQLErrorToast } from '@/hooks/useGQLErrorToast'
import { useToast } from '@repo/ui/use-toast'
import { ProcedureEditForm } from './procedure-edit-form'

type ProcedureEditPageProps = {
  procedureId: string
}

export function ProcedureEditPage({ procedureId }: ProcedureEditPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { toastGQLError } = useGQLErrorToast()

  const [{ fetching: saving }, updateProcedure] = useUpdateProcedureMutation()
  const [{ data: procedureData }] = useGetProcedureDetailsByIdQuery({ requestPolicy: 'network-only', variables: { procedureId: procedureId } })
  const [procedure, setProcedure] = useState(procedureData?.procedure ?? ({} as ProcedureByIdFragment))
  const [document, setDocument] = useState<Value>(procedure?.details?.content)

  const form = useForm<EditProcedureFormData>({
    resolver: zodResolver(EditProcedureSchema),
    mode: 'onBlur',
    disabled: saving,
    defaultValues: {
      name: procedure.name || '',
      description: procedure.description || '',
      background: procedure.background || '',
      procedureType: procedure.procedureType || '',
      purposeAndScope: procedure.purposeAndScope || '',
      tags: procedure.tags || [],
      details: procedure.details || {
        content: (procedure.details?.content || []) as Value[],
      },
    },
  })

  useEffect(() => {
    const procedure = procedureData?.procedure

    if (!procedure) return

    setProcedure(procedure)
    setDocument(procedure.details?.content || [])

    form.reset({
      name: procedure.name || '',
      description: procedure.description || '',
      background: procedure.background || '',
      purposeAndScope: procedure.purposeAndScope || '',
      procedureType: procedure.procedureType || '',
      tags: procedure.tags || [],
      details: procedure.details,
    })
  }, [procedureData])

  const actions = useMemo(() => {
    return [
      <Button key="view-procedure" onClick={() => router.push(`/procedures/${procedureId}`)} variant="outline" iconPosition="left" icon={<Eye />}>
        View
      </Button>,
    ]
  }, [procedure])

  if (!procedureData?.procedure) return <></>

  const handleSave = async () => {
    const { name, description, background, purposeAndScope, procedureType, tags } = form.getValues()

    const { error } = await updateProcedure({
      updateProcedureId: procedureData?.procedure.id,
      input: {
        name,
        description,
        background,
        purposeAndScope,
        procedureType,
        tags,
        details: {
          content: document,
        },
      },
    })

    if (error) {
      toastGQLError({ title: 'Failed to save Procedure', error })
      return
    }

    toast({ title: 'Procedure updated', variant: 'success' })
  }

  const title = procedure.displayID ? `${procedure.displayID} - ${procedure.name}` : procedure.name

  const main = <ProcedureEditForm form={form} document={document} setDocument={setDocument} />
  const sidebar = <ProcedureEditSidebar form={form} procedure={procedure} handleSave={handleSave} />

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={title} actions={actions} />

      <TwoColumnLayout main={main} aside={sidebar} />
    </>
  )
}
