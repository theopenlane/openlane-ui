'use client'

import { use, useEffect } from 'react'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import StandardDetailsView from '@/components/pages/protected/standards/standard-details-view'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { ObjectWithDetailsSkeleton } from '@/components/shared/skeleton/object-with-slideout-skeleton'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { OPENLANE_STANDARD_SHORT_NAME } from '@/constants'

const TemplateControlsPage = () => {
  const { data, isLoading, isError } = useStandardsSelect({ where: { shortName: OPENLANE_STANDARD_SHORT_NAME, systemOwned: true } })
  const standardId = data?.standards?.edges?.[0]?.node?.id
  const { setCrumbs } = use(BreadcrumbContext)

  useEffect(() => {
    if (standardId) {
      return
    }
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Compliance', href: '/programs' }, { label: 'Standards', href: '/standards' }, { label: 'Template Controls' }])
  }, [setCrumbs, standardId])

  if (isLoading) {
    return <ObjectWithDetailsSkeleton />
  }

  if (isError || !standardId) {
    return (
      <EmptyTabState
        title="Template controls are not available yet"
        description="The openlane-standard has not been seeded for this environment. Once it exists, its template controls will show up here."
      />
    )
  }

  return <StandardDetailsView standardId={standardId} breadcrumbLabel="Template Controls" />
}

export default TemplateControlsPage
