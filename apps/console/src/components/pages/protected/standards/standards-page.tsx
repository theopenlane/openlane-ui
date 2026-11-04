'use client'

import React, { use, useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Plus, SearchIcon } from 'lucide-react'
import { useGetStandardsCatalog } from '@/lib/graphql-hooks/standard'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import Link from 'next/link'
import { INFO_EMAIL, INFO_EMAIL_ADDRESS } from '@/constants'
import OfficialOnly from '@/components/shared/official-only/official-only'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { type StandardWhereInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { StandardsPageSkeleton } from '@/components/pages/protected/standards/skeleton/standards-page-skeleton'
import { getTasksFilterFields } from './table/table-config'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useOrganization } from '@/hooks/useOrganization'
import { getOnboardingFrameworks } from '@/lib/storage/onboarding-frameworks'
import { mergeWhere } from '@/lib/merge-where'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useSession } from 'next-auth/react'
import { tableActionAnchor } from '@/components/shared/element-anchor/element-anchor'
import { StandardCatalogCard } from './standard-catalog-card'
import { CUSTOM_FRAMEWORK_CREATE_HREF, STANDARDS_CATALOG_HREF, isCustomStandard, standardHref, standardLogoSrc } from './custom-framework/custom-framework'
import { StandardSource, StandardSourceTabs, useStandardSourceFilter } from './standard-source-tabs'

const filterFields = getTasksFilterFields()

const normalizeShortName = (value?: string | null) => value?.trim().toLowerCase().replace(/\s+/g, ' ')

const StandardsPage = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<StandardWhereInput | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { currentOrgId } = useOrganization()
  const [recommendedFrameworks, setRecommendedFrameworks] = useState<string[]>([])
  const { source, sourceWhere, setSource } = useStandardSourceFilter()
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRoles()
  const canCreateFramework = hasPermission(permission?.roles, AccessEnum.CanCreateStandard, session)

  useEffect(() => {
    setRecommendedFrameworks(getOnboardingFrameworks(currentOrgId))
  }, [currentOrgId])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Standards', href: STANDARDS_CATALOG_HREF },
    ])
  }, [setCrumbs])

  const whereFilter = useMemo<StandardWhereInput>(
    () => mergeWhere<StandardWhereInput>([debouncedSearchQuery ? { shortNameContainsFold: debouncedSearchQuery } : undefined, filters, sourceWhere]),
    [debouncedSearchQuery, filters, sourceWhere],
  )

  const { standards, isPending, isError } = useGetStandardsCatalog({ where: whereFilter, enabled: !!filters })

  const recommendedShortNames = useMemo(() => new Set(recommendedFrameworks.map(normalizeShortName).filter((name): name is string => !!name)), [recommendedFrameworks])

  const isRecommended = useCallback(
    (shortName?: string | null) => {
      const normalized = normalizeShortName(shortName)
      return !!normalized && recommendedShortNames.has(normalized)
    },
    [recommendedShortNames],
  )

  const catalogCards = useMemo(
    () =>
      standards
        .map((standard) => ({ standard, isCustom: isCustomStandard(standard), isRecommended: isRecommended(standard.shortName), logoSrc: standardLogoSrc(standard) }))
        .sort((a, b) => Number(b.isCustom) - Number(a.isCustom) || Number(b.isRecommended) - Number(a.isRecommended)),
    [standards, isRecommended],
  )

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <PageHeading heading="Standards Catalog" />
        {canCreateFramework && (
          <Button asChild icon={<Plus size={16} />} iconPosition="left" {...tableActionAnchor(ObjectTypes.STANDARD, 'create-custom')}>
            <Link href={CUSTOM_FRAMEWORK_CREATE_HREF}>Create framework</Link>
          </Button>
        )}
      </div>
      <div className="my-2 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-4">
          <Input
            value={searchQuery}
            name="standardSearch"
            placeholder="Search standards..."
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            icon={<SearchIcon width={17} />}
            iconPosition="left"
            variant="searchTable"
          />
          <TableFilter filterFields={filterFields} onFilterChange={setFilters} pageKey={TableKeyEnum.STANDARD_CATALOG} />
        </div>
        <StandardSourceTabs value={source} onValueChange={setSource} />
      </div>

      {isError ? (
        <p className="text-destructive">Error loading standards.</p>
      ) : isPending ? (
        <StandardsPageSkeleton />
      ) : (
        <div className="my-2 grid gap-7 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
          {catalogCards.map(({ standard, isCustom, isRecommended: recommended, logoSrc }) => (
            <StandardCatalogCard
              key={standard.id}
              shortName={standard.shortName ?? ''}
              version={standard.version}
              standardType={standard.standardType}
              controlCount={standard.controls.totalCount}
              updatedAt={standard.updatedAt}
              tags={standard.tags}
              description={standard.description}
              isCustom={isCustom}
              logoSrc={logoSrc}
              isRecommended={recommended}
              footer={
                <Button asChild variant="primary" className="py-2 px-4">
                  <Link href={standardHref(standard.id)}>Details</Link>
                </Button>
              }
            />
          ))}
          {canCreateFramework && source !== StandardSource.SUPPORTED && (
            <Card className="bg-card p-10 rounded-lg shadow-sm border border-dashed flex flex-col items-center justify-center gap-4 text-center min-h-[280px]">
              <div>
                <p className="font-semibold">Create a custom framework</p>
                <p className="text-sm text-muted-foreground">Name it, give it an icon, and bring in controls from a CSV or from controls you already have.</p>
              </div>
              <Button asChild variant="secondary" icon={<Plus size={16} />} iconPosition="left">
                <Link href={CUSTOM_FRAMEWORK_CREATE_HREF}>Get started</Link>
              </Button>
            </Card>
          )}
          <OfficialOnly>
            <Card className="bg-card p-10 rounded-lg shadow-sm border border-dashed flex flex-col items-center justify-center text-center min-h-[280px]">
              <p className="mb-4">Looking for a framework that’s not supported yet? Reach out with the details.</p>
              <Button asChild variant="secondary" className="text-primary">
                <a href={INFO_EMAIL}>{INFO_EMAIL_ADDRESS}</a>
              </Button>
            </Card>
          </OfficialOnly>
        </div>
      )}
    </>
  )
}

export default StandardsPage
