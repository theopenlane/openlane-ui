import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { Metadata } from 'next'
import ControlReportPage from '@/components/pages/protected/control-report/control-report-page'
import { Button } from '@repo/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Control Report',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <PageHeading heading="All Controls" />
            <Link href={'/controls'}>
              <Button className="h-8 p-2">View All Controls</Button>
            </Link>
          </div>
        }
      />
      <ControlReportPage />
    </>
  )
}

export default Page
