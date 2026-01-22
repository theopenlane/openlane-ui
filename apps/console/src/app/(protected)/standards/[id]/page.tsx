'use client'

import { PageHeading } from '@repo/ui/page-heading'
import { useParams } from 'next/navigation'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standards'
import StandardDetailsCard from '@/components/pages/protected/standards/standard-details-card'
import StandardDetailsAccordion from '@/components/pages/protected/standards/standard-details-accordion'
import { useEffect, useContext, useState } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { Button } from '@repo/ui/button'
import { canEdit } from '@/lib/authz/utils.ts'
import Loading from './loading'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { StandardIcon } from '@/components/shared/standard-icon/standard-icon'

const StandardDetailsPage = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useGetStandardDetails(id as string)
  const standard = data?.standard
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string }[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: permission, isLoading: isLoadingPermission } = useOrganizationRoles()

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

  const mainContent = (
    <>
      <div className="flex flex-col gap-7">
        <div className="flex flex-row gap-7 items-center">
          {<StandardIcon shortName={standard?.shortName} base64={standard?.logoFile?.base64} governingBodyLogoURL={standard?.governingBodyLogoURL} />}
          <PageHeading heading={data?.standard.name || 'Standard Details'} className="mb-3" />
        </div>
        <p className="">{data?.standard.description}</p>
        <div className="flex gap-14 w-full">
          <div className="flex flex-col gap-7 w-full">
            <StandardDetailsAccordion
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
              selectedControls={selectedControls}
              setSelectedControls={setSelectedControls}
              standardName={standard?.shortName ?? standard?.name}
              permission={permission}
              isLoadingPermission={isLoadingPermission}
            />
          </div>
        </div>
      </div>
    </>
  )

  const detailsCard = (
    <>
      <StandardDetailsCard />
    </>
  )

  const menuComponent = (
    <div>
      {canEdit(permission?.roles) && (
        <Button
          variant="secondary"
          className="h-8 !px-2"
          onClick={() => {
            setIsDialogOpen(true)
          }}
        >
          {selectedControls.length > 0 ? `Add Controls (${selectedControls.length})` : 'Add Controls'}
        </Button>
      )}
    </div>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Standards - ${standard?.shortName ?? standard?.name}`}</title>
      <SlideBarLayout sidebarTitle="Details" menu={menuComponent} sidebarContent={detailsCard}>
        {mainContent}
      </SlideBarLayout>
    </>
  )
}

export default StandardDetailsPage
