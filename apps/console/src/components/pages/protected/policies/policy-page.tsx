import React, { useContext } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicyInfoBar } from '@/components/pages/protected/policies/policy-info-bar'
import { PolicySidebar } from '@/components/pages/protected/policies/policy-sidebar'
import dynamic from 'next/dynamic'
import { PolicyContext } from './context'

const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), { ssr: false })

export function PolicyPage() {
  const { policy } = useContext(PolicyContext)

  if (!policy) {
    return
  }

  return (
    <>
      <PageHeading className="grow" eyebrow="Policies & Procedures" heading={policy.name} />

      {policy?.id && <PolicyInfoBar policy={policy} />}

      {/* plate editor */}
      <div className="flex flex-col gap-5 w-full">
        {/* Main */}
        <div className="w-full">
          <div>
            <PlateEditor content={policy?.details?.content || []} />
          </div>
        </div>

        {/* Sidebar */}
        <PolicySidebar />
      </div>
    </>
  )
}
