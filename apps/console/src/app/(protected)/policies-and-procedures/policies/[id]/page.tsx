'use client'
import React, { Suspense, useEffect } from 'react'
import { useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { NextPage } from 'next'
import { PolicyPage } from '@/components/pages/protected/policies/policy-page'
import { usePolicyPageActions } from '@/hooks/usePolicyPage'

type PageProps = {
  params: { id: string }
}

const Page: NextPage<PageProps> = ({ params }) => {
  const { setPolicy } = usePolicyPageActions()

  const [result] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: params.id } })
  const { data, fetching, error } = result
  const [{ error: saveError }, updatePolicy] = useUpdateInternalPolicyMutation()

  useEffect(() => {
    if (data?.internalPolicy) {
      setPolicy(data.internalPolicy)
    }
  }, [data])

  return <PolicyPage />
}

export default Page
