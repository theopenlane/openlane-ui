import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'
import { useForm } from 'react-hook-form'
import { PolicyEditSidebar } from './policy-edit-sidebar'
import { InternalPolicyByIdFragment, useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { useEffect, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicyEditForm } from './policy-edit-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditPolicySchema, EditPolicyFormData } from './policy-edit-form-types'
import type { Value } from '@udecode/plate-common'

type PolicyEditPageProps = {
  policyId: string
}

export function PolicyEditPage({ policyId }: PolicyEditPageProps) {
  const [{ fetching: saving }, updatePolicy] = useUpdateInternalPolicyMutation()
  const [{ data: policyData }] = useGetInternalPolicyDetailsByIdQuery({ requestPolicy: 'network-only', variables: { internalPolicyId: policyId } })
  const [policy, setPolicy] = useState(policyData?.internalPolicy ?? ({} as InternalPolicyByIdFragment))
  const [document, setDocument] = useState<Value>(policy?.details?.content)

  const form = useForm<EditPolicyFormData>({
    resolver: zodResolver(EditPolicySchema),
    mode: 'onBlur',
    disabled: saving,
    defaultValues: {
      name: policy.name || '',
      description: policy.description || '',
      background: policy.background || '',
      purposeAndScope: policy.purposeAndScope || '',
      tags: policy.tags || [],
      details: policy.details || {
        content: (policy.details?.content || []) as Value[],
      },
    },
  })

  useEffect(() => {
    const policy = policyData?.internalPolicy

    if (!policy) return

    setPolicy(policy)
    setDocument(policy.details?.content || [])

    form.reset({
      name: policy.name || '',
      description: policy.description || '',
      background: policy.background || '',
      purposeAndScope: policy.purposeAndScope || '',
      tags: policy.tags || [],
      details: policy.details,
    })
  }, [policyData])

  if (!policyData?.internalPolicy) return <></>

  const handleSave = async () => {
    const { name, description, background, purposeAndScope, tags } = form.getValues()

    const { error } = await updatePolicy({
      updateInternalPolicyId: policyData?.internalPolicy.id,
      input: {
        name,
        description,
        background,
        purposeAndScope,
        tags,
        details: {
          content: document,
        },
      },
    })

    if (error) {
      console.error(error)
    }
  }

  const policyName = policy.displayID ? `${policy.displayID} - ${policy.name}` : policy.name

  const main = <PolicyEditForm form={form} document={document} setDocument={setDocument} />
  const sidebar = <PolicyEditSidebar form={form} policy={policy} handleSave={handleSave} />

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={policyName} />

      <TwoColumnLayout main={main} aside={sidebar} />
    </>
  )
}
