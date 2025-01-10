'use client'

import { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { Policy, PolicyPage } from '@/components/pages/protected/policies/policy-page'
import { useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation } from '@repo/codegen/src/schema'

type PageProps = {
  params: { id: string }
}

export const Page: NextPage<PageProps> = ({ params }) => {
  const [{ fetching, data, error: queryError }] = useGetInternalPolicyDetailsByIdQuery({
    variables: { internalPolicyId: params.id },
  })

  const [{ error: updateError }, updatePolicy] = useUpdateInternalPolicyMutation()
  const [internalPolicy, setInternalPolicy] = useState<Policy>({
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
  })

  useEffect(() => {
    if (!data) return
    console.log('Page: setInternalPolicy', data)
    const ip = data.internalPolicy
    setInternalPolicy({
      id: ip.id ?? null,
      name: ip.name ?? null,
      status: ip.status ?? null,
      version: ip.version ?? null,
      policyType: ip.policyType ?? null,
      updatedAt: ip.updatedAt ?? null,
      updatedBy: ip.updatedBy ?? null,
      description: ip.description ?? null,
      background: ip.background ?? null,
      purposeAndScope: ip.purposeAndScope ?? null,
      details: ip.details ?? null,
    })
  }, [data])

  function save(policy: Policy) {
    console.log('Page: save')

    const updateInternalPolicyId = params.id
    const { name, status, version, policyType, description, background, purposeAndScope } = policy
    const input = { name, status, version, policyType, description, background, purposeAndScope }

    updatePolicy({ updateInternalPolicyId, input })
  }

  function doDelete() {
    console.log('Page: doDelete')
  }

  if (!internalPolicy.id) return null

  return <PolicyPage save={save} delete={doDelete} internalPolicy={internalPolicy} />
}

export default Page
