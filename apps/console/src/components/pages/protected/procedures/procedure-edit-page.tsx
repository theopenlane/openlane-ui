import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'
import { useForm } from 'react-hook-form'
import { ProcedureEditSidebar } from './procedure-edit-sidebar'
import { useEffect, useMemo, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditProcedureSchema, EditProcedureFormData } from './procedure-edit-form-types'
import { Button } from '@repo/ui/button'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProcedureEditForm } from './procedure-edit-form'
import { useNotification } from '@/hooks/useNotification'
import { useGetProcedureDetailsById, useUpdateProcedure } from '@/lib/graphql-hooks/procedures'
import { Procedure } from '@repo/codegen/src/schema'
import { useQueryClient } from '@tanstack/react-query'

type ProcedureEditPageProps = {
  procedureId: string
}

export function ProcedureEditPage({ procedureId }: ProcedureEditPageProps) {
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const { isPending: saving, mutateAsync: updateProcedure } = useUpdateProcedure()
  const { data: procedureData } = useGetProcedureDetailsById(procedureId)
  const [procedure, setProcedure] = useState((procedureData?.procedure || {}) as Procedure)
  const [document, setDocument] = useState<string>(procedure?.details!!)

  const form = useForm<EditProcedureFormData>({
    resolver: zodResolver(EditProcedureSchema),
    mode: 'onBlur',
    disabled: saving,
    defaultValues: {
      name: procedure?.name || '',
      tags: procedure?.tags || [],
      details: procedure?.details!!,
    },
  })

  useEffect(() => {
    const procedure = procedureData?.procedure

    if (!procedure) return

    setProcedure(procedure as Procedure)
    setDocument(procedure?.details ?? '')

    form.reset({
      name: procedure?.name || '',
      tags: procedure?.tags || [],
      details: procedure?.details ?? '',
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
    const { name, tags, procedureType } = form.getValues()

    try {
      await updateProcedure({
        updateProcedureId: procedureData?.procedure.id,
        input: {
          name,
          tags,
          details: document,
          procedureType,
        },
      })
      successNotification({ title: 'Procedure updated' })
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [firstKey, secondKey] = query.queryKey
          return firstKey === 'policies' || (firstKey === 'policy' && secondKey === procedureData?.procedure.id)
        },
      })
    } catch {
      errorNotification({ title: 'Failed to save Procedure' }) // TODO:  gqlError:error ass error to notification
    }
  }

  const title = procedure?.displayID ? `${procedure?.displayID} - ${procedure?.name}` : procedure?.name

  const main = <ProcedureEditForm form={form} document={document} setDocument={setDocument} />
  const sidebar = <ProcedureEditSidebar form={form} procedure={procedure} handleSave={handleSave} />

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={title} actions={actions} />

      <TwoColumnLayout main={main} aside={sidebar} />
    </>
  )
}
