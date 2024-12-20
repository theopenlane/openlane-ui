'use client'
import React, { createContext, useState, useEffect } from 'react'
import { useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { NextPage } from 'next'
import { UpdateableFields } from '@/components/pages/protected/policies/policy-sidebar'
import { PolicyPage } from '@/components/pages/protected/policies/policy-page'
import { PolicyContext } from '@/components/pages/protected/policies/context'
import { Policy } from '@/components/pages/protected/policies/context'

type PageProps = {
  params: { id: string }
}

const Page: NextPage<PageProps> = ({ params }) => {
  const [result] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: params.id } })
  const { data, fetching, error } = result
  const [{ error: saveError }, updatePolicy] = useUpdateInternalPolicyMutation()

  const [policy, setPolicy] = useState<Policy>({ id: '', name: '' })

  useEffect(() => {
    if (data?.internalPolicy) {
      setPolicy(data.internalPolicy)
    }
  }, [data])

  const onFieldChange = (field: UpdateableFields, value: string) => {
    setPolicy((prev) => ({ ...prev, [field]: value }))
  }

  const saveField = (field: UpdateableFields, value: string) => {
    updatePolicy({
      updateInternalPolicyId: params.id,
      input: { [field]: value },
    })
  }

  return (
    <PolicyContext.Provider value={{ policy, saveField, onFieldChange }}>
      <PolicyPage />
    </PolicyContext.Provider>
  )
}

export default Page
