'use client'

import { PageHeading } from '@repo/ui/page-heading'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standard'
import StandardDetailsCard from './standard-details-card'
import StandardDetailsAccordion from './standard-details-accordion'
import { useEffect, use, useState } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { Button } from '@repo/ui/button'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { ObjectWithDetailsSkeleton } from '@/components/shared/skeleton/object-with-slideout-skeleton'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'

type TStandardDetailsViewProps = {
  standardId: string
  breadcrumbLabel?: string
}

const StandardDetailsView: React.FC<TStandardDetailsViewProps> = ({ standardId, breadcrumbLabel }) => {
  const { data, isLoading, error } = useGetStandardDetails(standardId)
  const standard = data?.standard
  const { setCrumbs } = use(BreadcrumbContext)
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string }[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: permission, isLoading: isLoadingPermission } = useOrganizationRoles()
  const { data: session } = useSession()

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Standards', href: '/standards' },
      { label: breadcrumbLabel ?? standard?.shortName ?? standard?.name, isLoading: breadcrumbLabel ? false : isLoading },
    ])
  }, [setCrumbs, standard, isLoading, breadcrumbLabel])

  if (isLoading) {
    return <ObjectWithDetailsSkeleton />
  }
  if (error) {
    return <div>Error loading standard details.</div>
  }

  const mainContent = (
    <div className="flex flex-col gap-7">
      <div className="flex flex-row gap-7 items-center">
        <StandardsIconMapper shortName={standard?.shortName ?? ''} />
        <PageHeading heading={standard?.name || 'Standard Details'} className="mb-3" />
      </div>
      <p className="">{standard?.description}</p>
      <div className="flex gap-14 w-full">
        <div className="flex flex-col gap-7 w-full">
          <StandardDetailsAccordion
            standardId={standardId}
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
  )

  const detailsCard = <StandardDetailsCard standardId={standardId} />

  const menuComponent = (
    <div>
      {hasPermission(permission?.roles, AccessEnum.CanCreateControl, session) && (
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
    <SlideBarLayout sidebarTitle="Details" menu={menuComponent} sidebarContent={detailsCard}>
      {mainContent}
    </SlideBarLayout>
  )
}

export default StandardDetailsView
