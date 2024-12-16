'use client'

import { useState, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PoliciesForm, PolicyFormSchema } from '@/components/pages/protected/policies/policies-form'
import { NextPage } from 'next'
import { useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import { useGqlError } from '@/hooks/useGqlError'
import { useToast } from '@repo/ui/use-toast'

type PageProps = {
  params: { id: string }
}

const Page: NextPage<PageProps> = ({ params }) => {
  const router = useRouter()
  const { toast } = useToast()

  const [{ data }] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: params.id } })
  const [policyModel, setPolicyModel] = useState({ name: '' })

  useEffect(() => {
    if (data?.internalPolicy.id) {
      setPolicyModel(data?.internalPolicy)
    }
  }, [data])

  const [{ error: submitError }, updatePolicy] = useUpdateInternalPolicyMutation()
  const { errorMessages } = useGqlError(submitError)

  useEffect(() => {
    if (!errorMessages?.length) return
    toast({
      title: `Error`,
      description: 'We couldnt save the policy: ' + errorMessages.join('\n'),
      variant: 'destructive',
    })
  }, [errorMessages])

  const onSubmit = async (policy: PolicyFormSchema) => {
    const { data } = await updatePolicy({
      updateInternalPolicyId: params.id,
      input: {
        name: policy.name,
        description: policy.description,
        background: policy.background,
        policyType: policy.policyType,
        purposeAndScope: policy.purposeAndScope,
        details: policy.details,
      },
    })

    if (data?.updateInternalPolicy?.internalPolicy?.id) {
      router.push('/policies-and-procedures/policies/' + data?.updateInternalPolicy.internalPolicy?.id || '')
    }
  }

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading="Edit Policy" />
      {data?.internalPolicy.id && <PoliciesForm onSubmit={onSubmit} policy={policyModel} />}
    </>
  )
}

export default Page
