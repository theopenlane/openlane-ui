'use client'

import React from 'react'
import { NextPage } from 'next'
import { Policy, PolicyPage } from '@/components/pages/protected/policies/policy-page'
import { useCreateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
const Page: NextPage = async () => {
  const router = useRouter()
  const [{ error: createError }, createPolicy] = useCreateInternalPolicyMutation()

  const save = async (policy: Policy) => {
    console.log('Page: save')

    const { name, status, version, policyType, description, background, purposeAndScope } = policy
    const input = { name, status, version, policyType, description, background, purposeAndScope }

    const response = await createPolicy({ input })
    if (response.error) {
      console.error(response.error)
      return
    }

    if (response?.data?.createInternalPolicy?.internalPolicy?.id) {
      console.log('Policy created:', response.data.createInternalPolicy)
      router.push('/policies-and-procedures/policies/' + response.data.createInternalPolicy.internalPolicy.id)
    }
  }

  const noop = () => {}

  const policy = {
    name: 'New Policy',
    status: 'new',
    version: '0',
    policyType: null,
    updatedAt: null,
    updatedBy: null,
    description: null,
    background: null,
    purposeAndScope: null,
    details: {
      content: [],
    },
  }

  return <PolicyPage internalPolicy={policy} save={save} delete={noop} />
}

export default Page
