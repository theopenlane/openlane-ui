import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'
import { useForm } from 'react-hook-form'
import { PolicyEditSidebar } from './policy-edit-sidebar'
import { InternalPolicyByIdFragment, useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { useEffect, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicyEditForm } from './policy-edit-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditPolicySchema, EditPolicyFormData } from './policy-edit-form-types'

type PolicyEditPageProps = {
  policyId: string
}

export function PolicyEditPage({ policyId }: PolicyEditPageProps) {
  const [{ fetching: saving }, updatePolicy] = useUpdateInternalPolicyMutation()
  const [{ data: policyData }] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: policyId } })
  const [policy, setPolicy] = useState({} as InternalPolicyByIdFragment)

  const form = useForm<EditPolicyFormData>({
    resolver: zodResolver(EditPolicySchema),
    mode: 'onBlur',
    disabled: saving,
    defaultValues: {
      name: policy.name || '',
      description: policy.description || '',
      background: policy.background || '',
      purposeAndScope: policy.purposeAndScope || '',
    },
  })

  useEffect(() => {
    const policy = policyData?.internalPolicy

    if (!policy) return

    setPolicy(policy)

    form.reset({
      name: policy.name || '',
      description: policy.description || '',
      background: policy.background || '',
      purposeAndScope: policy.purposeAndScope || '',
    })
  }, [policyData])

  if (!policyData?.internalPolicy) return <></>

  const handleSave = async () => {
    const { name, description, background, purposeAndScope } = form.getValues()

    const { error } = await updatePolicy({
      updateInternalPolicyId: policyData?.internalPolicy.id,
      input: {
        name,
        description,
        background,
        purposeAndScope,
      },
    })

    if (error) {
      console.error(error)
    }
  }

  const policyName = policy.displayID ? `${policy.displayID} - ${policy.name}` : policy.name

  const main = <PolicyEditForm form={form} />
  const sidebar = <PolicyEditSidebar form={form} policy={policy} handleSave={handleSave} />

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={policyName} />

      <TwoColumnLayout main={main} aside={sidebar} />
    </>
  )
}
