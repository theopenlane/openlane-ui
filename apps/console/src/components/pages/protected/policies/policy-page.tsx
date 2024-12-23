import React, { useState, useContext } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicyInfoBar } from '@/components/pages/protected/policies/policy-info-bar'
import { PolicySidebar } from '@/components/pages/protected/policies/policy-sidebar'
import dynamic from 'next/dynamic'
import { usePolicyPageStore } from '@/hooks/usePolicyPage'

const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), { ssr: false })

export function PolicyPage() {
  const name = usePolicyPageStore((state) => state.policy.name)
  const details = usePolicyPageStore((state) => state.policy.details)

  return (
    <>
      <PageHeading className="grow" eyebrow="Policies & Procedures" heading={name} />

      <PolicyInfoBar />

      {/* plate editor */}
      <div className="flex flex-col gap-5 w-full">
        {/* Sidebar */}
        <PolicySidebar />

        {/* Main */}
        <div className="w-full">
          <div>
            <PlateEditor content={details?.content ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
