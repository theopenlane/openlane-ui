'use client'

import { use, useEffect } from 'react'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import StandardDetailsView from '@/components/pages/protected/standards/standard-details-view'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { ObjectWithDetailsSkeleton } from '@/components/shared/skeleton/object-with-slideout-skeleton'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { OPENLANE_BASELINE_STANDARD } from '@/constants/standards'

const TemplateControlsPage = () => {
  const { data, isLoading, isError } = useStandardsSelect({
    where: { framework: OPENLANE_BASELINE_STANDARD.framework, systemOwned: true },
  })
  const standardId = data?.standards?.edges?.[0]?.node?.id
  const detailsViewOwnsCrumbs = Boolean(standardId)
  const { setCrumbs } = use(BreadcrumbContext)

  useEffect(() => {
    if (detailsViewOwnsCrumbs) {
      return
    }
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Compliance', href: '/programs' }, { label: 'Standards', href: '/standards' }, { label: 'Template Controls' }])
  }, [setCrumbs, detailsViewOwnsCrumbs])

  if (isLoading) {
    return <ObjectWithDetailsSkeleton />
  }

  if (isError || !standardId) {
    return (
      <EmptyTabState
        title="Template controls are not available yet"
        description={`The ${OPENLANE_BASELINE_STANDARD.shortName} standard isn't available in this workspace yet. Once it is, its template controls will show up here.`}
      />
    )
  }

  return <StandardDetailsView standardId={standardId} breadcrumbLabel="Template Controls" />
}

export default TemplateControlsPage
