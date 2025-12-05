import { PageHeading } from '@repo/ui/page-heading'
import { TemplatesTable } from '@/components/pages/protected/template/table/template-table.tsx'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Templates',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Templates" />
      <TemplatesTable />
    </>
  )
}

export default Page
