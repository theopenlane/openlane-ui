'use client'

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { useGetInternalPolicyDetailsByIdQuery } from '@repo/codegen/src/schema'
import { NextPage } from 'next'
import Link from 'next/link'

type PageProps = {
  id: string
}

const Page: NextPage<PageProps> = ({ params }) => {
  const [result] = useGetInternalPolicyDetailsByIdQuery({
    variables: { internalPolicyId: params.id },
  })
  const { data, fetching, error } = result

  // const updatePolicy = async ({
  //   name,
  //   description,
  //   purposeAndScope,
  //   policyType,
  //   background,
  // }: UpdateInternalPolicyInput) => {
  //   console.log('creating policy', { name })
  //   createPolicy({
  //     input: {
  //       name,
  //       description,
  //       purposeAndScope,
  //       policyType,
  //       background,
  //     },
  //   })
  //   // await updateUserName({
  //   //   updateUserId: userId,
  //   //   input: {
  //   //     firstName: firstName,
  //   //     lastName: lastName,
  //   //   },
  //   // })
  //   // setIsSuccess(true)
  // }
  // const onSubmit = (data: z.infer<typeof formSchema>) => {
  //   updatePolicy({
  //     name: data.name,
  //     description: data.description,
  //     purposeAndScope: data.purposeAndScope,
  //     policyType: data.policyType,
  //     background: data.background,
  //   })
  // }
  return (
    <>
      <Link
        href={`/policies-and-procedures/policies/${params.id}/edit`}
        className="underline"
      >
        edit
      </Link>
      <PageHeading eyebrow="Policies & Procedures" heading="View Policy" />

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  )
}

export default Page
