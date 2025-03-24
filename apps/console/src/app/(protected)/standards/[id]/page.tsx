'use client'
import { PageHeading } from '@repo/ui/page-heading'
import { useParams } from 'next/navigation'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standards'
import { Loading } from '@/components/shared/loading/loading'
import StandardDetailsCard from '@/components/pages/protected/standards/standard-details-card'
import StandardDetailsAccordion from '@/components/pages/protected/standards/standard-details-accordion'

const StandardDetailsPage = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useGetStandardDetails(id as string)

  if (isLoading) {
    return <Loading />
  }
  if (error) {
    return <div>Error loading standard details.</div>
  }
  return (
    <div className="flex gap-14">
      <div className="flex flex-col gap-7 ">
        <PageHeading heading={data?.standard.name || 'Standard Details'} className="mb-3" />
        <p className="">{data?.standard.description}</p>

        <StandardDetailsAccordion />
      </div>
      <StandardDetailsCard />
    </div>
  )
}

export default StandardDetailsPage
