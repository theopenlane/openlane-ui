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
import Link from 'next/link'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { ObjectWithDetailsSkeleton } from '@/components/shared/skeleton/object-with-slideout-skeleton'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'
import { useSetDocsHelpTopic } from '@/components/shared/docs-help/docs-help-context'
import { docsHelpQuery } from '@/components/shared/docs-help/docs-help-query'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import AddToOrganizationDialog from './add-to-organization-dialog'
import ControlDetailsSheet from './control-details-sheet'
import { CustomFrameworkHeaderActions } from './custom-framework/custom-framework-header-actions'
import { STANDARDS_CATALOG_HREF, isCustomStandard, standardDisplayName, standardLogoSrc } from './custom-framework/custom-framework'

type TStandardDetailsViewProps = {
  standardId: string
  breadcrumbLabel?: string
}

const StandardDetailsView: React.FC<TStandardDetailsViewProps> = ({ standardId, breadcrumbLabel }) => {
  const { data, isLoading, error } = useGetStandardDetails(standardId)
  const standard = data?.standard
  const { setCrumbs } = use(BreadcrumbContext)

  // point the global docs tab at this standard's own doc pages instead of the
  // catalog, prefer matches the doc page title (e.g. "SOC 2")
  const standardName = standard?.shortName || standard?.name
  useSetDocsHelpTopic(
    standardName
      ? {
          title: standardName,
          query: docsHelpQuery('view', `the ${standardName} standard`),
          prefer: standardName,
        }
      : null,
  )
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string }[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: permission, isLoading: isLoadingPermission } = useOrganizationRoles()
  const { data: session } = useSession()

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Standards', href: STANDARDS_CATALOG_HREF },
      { label: breadcrumbLabel ?? standard?.shortName ?? standard?.name, isLoading: breadcrumbLabel ? false : isLoading },
    ])
  }, [setCrumbs, standard, isLoading, breadcrumbLabel])

  if (isLoading) {
    return <ObjectWithDetailsSkeleton />
  }
  if (error || !standard) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Framework not found.</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href={STANDARDS_CATALOG_HREF}>Back to Standards Catalog</Link>
        </Button>
      </div>
    )
  }

  const isCustom = isCustomStandard(standard)
  const canAdoptControls = !isCustom && !isLoadingPermission && hasPermission(permission?.roles, AccessEnum.CanCreateControl, session)

  const mainContent = (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-row items-center gap-7">
          <StandardsIconMapper shortName={standard.shortName ?? ''} logoSrc={standardLogoSrc(standard)} isCustom={isCustom} />
          <PageHeading heading={standard.name} />
        </div>
        {isCustom ? (
          <CustomFrameworkHeaderActions standard={standard} />
        ) : (
          <DetailHeaderActions
            actions={
              canAdoptControls && (
                <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
                  {selectedControls.length > 0 ? `Add Controls (${selectedControls.length})` : 'Add Controls'}
                </Button>
              )
            }
          />
        )}
      </div>
      <p className="">{standard.description}</p>
      <div className="flex gap-14 w-full">
        <div className="flex flex-col gap-7 w-full">
          <StandardDetailsAccordion
            standardId={standardId}
            selectedControls={selectedControls}
            setSelectedControls={setSelectedControls}
            selectable={canAdoptControls}
            showSubcontrolsColumn={standard.controlsWithSubcontrols.totalCount > 0}
            rowHref={isCustom ? (control) => getHrefForObjectType(ObjectAssociationNodeEnum.CONTROL, { id: control.id }) : undefined}
            emptyState={isCustom && <EmptyTabState title="No controls yet" description="Use Add controls to import them from a CSV or link custom controls you already have." />}
          />
        </div>
      </div>
      {!isCustom && (
        <>
          <AddToOrganizationDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            standardId={selectedControls.length === 0 ? standardId : undefined}
            selectedControls={selectedControls}
            standardName={selectedControls.length === 0 ? standardDisplayName(standard) : undefined}
          />
          <ControlDetailsSheet />
        </>
      )}
    </div>
  )

  const detailsCard = <StandardDetailsCard standardId={standardId} />

  return (
    <SlideBarLayout sidebarTitle="Details" sidebarContent={detailsCard}>
      {mainContent}
    </SlideBarLayout>
  )
}

export default StandardDetailsView
