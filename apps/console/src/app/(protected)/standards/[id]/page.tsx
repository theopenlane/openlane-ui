'use client'

import { PageHeading } from '@repo/ui/page-heading'
import { useParams } from 'next/navigation'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standards'
import { Loading } from '@/components/shared/loading/loading'
import StandardDetailsCard from '@/components/pages/protected/standards/standard-details-card'
import StandardDetailsAccordion from '@/components/pages/protected/standards/standard-details-accordion'
import { useEffect, useContext } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'

const StandardDetailsPage = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useGetStandardDetails(id as string)
  const standard = data?.standard
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Standards', href: '/standards' },
      { label: standard?.shortName ?? standard?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, standard, isLoading])

  if (isLoading) {
    return <Loading />
  }
  if (error) {
    return <div>Error loading standard details.</div>
  }

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Standards - ${standard?.shortName ?? standard?.name}`}</title>
      <div className="flex flex-col gap-7 ">
        <div className="flex flex-row gap-7 items-center">
          <StandardsIconMapper shortName={standard?.shortName ?? ''} />
          <PageHeading heading={data?.standard.name || 'Standard Details'} className="mb-3" />
        </div>
        <div className="flex gap-14">
          <div className="flex flex-col gap-7 ">
            <p className="">{data?.standard.description}</p>
            <StandardDetailsAccordion standardName={standard?.shortName ?? standard?.name} />
          </div>
          <div>
            <StandardDetailsCard />
          </div>
        </div>
      </div>
    </>
  )
}

export default StandardDetailsPage
