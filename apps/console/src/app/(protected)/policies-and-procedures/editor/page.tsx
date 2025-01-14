import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'

import dynamic from 'next/dynamic'

const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), { ssr: false })

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading="Editor" />

      <div className="h-[90%]">
        <PlateEditor />
      </div>
    </>
  )
}

export default Page
