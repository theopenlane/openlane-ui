'use client'

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { useGetInternalPolicyDetailsByIdQuery } from '@repo/codegen/src/schema'
import { NextPage } from 'next'
import Link from 'next/link'

type PageProps = {
  params: { id: string }
}

const Page: NextPage<PageProps> = ({ params }) => {
  const [result] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: params.id } })
  const { data, fetching, error } = result

  return (
    <>
      <Link href={`/policies-and-procedures/policies/${params.id}/edit`} className="underline">
        edit
      </Link>
      <PageHeading eyebrow="Policies & Procedures" heading="View Policy" />
      <pre>{JSON.stringify({ fetching, error, data }, null, 2)}</pre>
    </>
  )
}

export default Page
