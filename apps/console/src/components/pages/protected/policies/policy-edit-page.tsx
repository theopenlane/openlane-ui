import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'
import { useForm } from 'react-hook-form'
import { PolicyEditSidebar } from './policy-edit-sidebar'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { useEffect, useMemo, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicyEditForm } from './policy-edit-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditPolicySchema, EditPolicyFormData } from './policy-edit-form-types'
import type { Value } from '@udecode/plate-common'
import { Button } from '@repo/ui/button'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { useGetInternalPolicyDetailsById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy'
import { useQueryClient } from '@tanstack/react-query'

type PolicyEditPageProps = {
  policyId: string
}

export function PolicyEditPage({ policyId }: PolicyEditPageProps) {
  const router = useRouter()
  const { errorNotification, successNotification } = useNotification()
  const queryClient = useQueryClient()
  const { isPending: saving, mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { data: policyData } = useGetInternalPolicyDetailsById(policyId)
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
      policyType: policy.policyType || '',
      purposeAndScope: policy.purposeAndScope || '',
      tags: policy.tags || [],
      details: policy.details || {
        content: (policy.details?.content || []) as Value[],
      },
    },
  })

  useEffect(() => {
    const policy = policyData?.internalPolicy

    if (!policy) {
      return
    }

    setPolicy(policy)
    setDocument(policy.details?.content || [])

    form.reset({
      name: policy.name || '',
      description: policy.description || '',
      background: policy.background || '',
      purposeAndScope: policy.purposeAndScope || '',
      policyType: policy.policyType || '',
      tags: policy.tags || [],
      details: policy.details,
    })
  }, [policyData])

  const actions = useMemo(() => {
    return [
      <Button key="view-policy" onClick={() => router.push(`/policies/${policyId}`)} variant="outline" iconPosition="left" icon={<Eye />}>
        View
      </Button>,
    ]
  }, [policy])

  if (!policyData?.internalPolicy) return <></>

  const handleSave = async () => {
    const { name, description, background, purposeAndScope, policyType, tags } = form.getValues()

    try {
      await updatePolicy({
        updateInternalPolicyId: policyData?.internalPolicy.id,
        input: {
          name,
          description,
          background,
          purposeAndScope,
          policyType,
          tags,
          details: {
            content: document,
          },
        },
      })
      successNotification({ title: 'Policy updated' })
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [firstKey, secondKey] = query.queryKey
          return firstKey === 'internalPolicies' || (firstKey === 'internalPolicy' && secondKey === policyData?.internalPolicy.id)
        },
      })
    } catch {
      errorNotification({ title: 'Failed to save Policy' })
      //  gqlError: error todo: pass graphql error
    }
  }

  const policyName = policy.displayID ? `${policy.displayID} - ${policy.name}` : policy.name

  const main = <PolicyEditForm form={form} document={document} setDocument={setDocument} />
  const sidebar = <PolicyEditSidebar form={form} policy={policy} handleSave={handleSave} />

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={policyName} actions={actions} />

      <TwoColumnLayout main={main} aside={sidebar} />
    </>
  )
}
