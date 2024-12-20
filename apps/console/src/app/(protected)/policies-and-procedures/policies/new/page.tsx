'use client'

import React, { useEffect, useState } from 'react'
import { useCreateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { NextPage } from 'next'
import { UpdateableFields } from '@/components/pages/protected/policies/policy-sidebar'
import { PolicyPage } from '@/components/pages/protected/policies/policy-page'
import { PolicyContext } from '@/components/pages/protected/policies/context'
import { Policy } from '@/components/pages/protected/policies/context'
import { useRouter } from 'next/navigation'

const Page: NextPage = async () => {
  const router = useRouter()
  const [{ error }, createPolicy] = useCreateInternalPolicyMutation()

  const [policy, setPolicy] = useState<Policy>({ name: 'Untitled Document' })

  const onFieldChange = (field: UpdateableFields, value: string) => {
    setPolicy((prev) => ({ ...prev, [field]: value }))
  }

  const saveField = (field: UpdateableFields, value: string) => {}

  const create = async () => {
    const { data } = await createPolicy({ input: policy })
    if (data?.createInternalPolicy?.internalPolicy?.id) {
      router.push('/policies-and-procedures/policies/' + data?.createInternalPolicy.internalPolicy?.id || '')
    }
  }

  return (
    <PolicyContext.Provider value={{ policy, saveField, onFieldChange, create }}>
      <PolicyPage />
    </PolicyContext.Provider>
  )
}

export default Page
