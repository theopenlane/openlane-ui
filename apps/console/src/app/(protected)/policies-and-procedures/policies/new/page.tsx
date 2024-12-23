'use client'

import React, { useEffect, useState } from 'react'
import { useCreateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { NextPage } from 'next'
import { PolicyPage } from '@/components/pages/protected/policies/policy-page'
import { useRouter } from 'next/navigation'
import { usePolicyPageActions } from '@/hooks/usePolicyPage'

const usePolicyPageHook = () => {
  const router = useRouter()
  const [{ error, fetching: saving }, createPolicy] = useCreateInternalPolicyMutation()
  const { setPolicy } = usePolicyPageActions()

  useEffect(() => {
    setPolicy({})
  }, [])

  // const create = async () => {
  //   const { data } = await createPolicy({ input: policy })
  //   if (data?.createInternalPolicy?.internalPolicy?.id) {
  //     router.push('/policies-and-procedures/policies/' + data?.createInternalPolicy.internalPolicy?.id || '')
  //   }
  // }

  return
}

const Page: NextPage = async () => {
  usePolicyPageHook()

  return <PolicyPage />
}

export default Page
