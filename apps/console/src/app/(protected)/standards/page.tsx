'use client'

import React, { useState, useMemo } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { CheckCircleIcon, Settings2, SettingsIcon, SearchIcon } from 'lucide-react'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { Input } from '@repo/ui/input'
import { FilterField } from '@/types'
import { useDebounce } from '@uidotdev/usehooks'
import { Loading } from '@/components/shared/loading/loading'
import Link from 'next/link'
import { formatDateSince } from '@/utils/date'
import { INFO_EMAIL } from '@/constants'

const filterFields: FilterField[] = [
  { key: 'systemOwned', label: 'System Owned', type: 'boolean' },
  { key: 'updatedAt', label: 'Updated At', type: 'date' },
  { key: 'createdAt', label: 'Created At', type: 'date' },
  { key: 'version', label: 'Version', type: 'text' },
  { key: 'revision', label: 'Revision', type: 'text' },
  { key: 'governingBody', label: 'Governing Body', type: 'text' },
]

const StandardsPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any> | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {
      ...(debouncedSearchQuery ? { shortNameContainsFold: debouncedSearchQuery } : {}),
      ...filters,
    }

    return conditions
  }, [debouncedSearchQuery, filters])

  const { data, isLoading, isError } = useGetStandards({ where: whereFilter, enabled: !!filters })

  if (isLoading) {
    return <Loading />
  }

  if (isError) {
    return <p className="text-red-500">Error loading standards.</p>
  }

  return (
    <>
      <PageHeading heading="Standards Catalog" />
      <div className="mt-5 flex justify-between items-center gap-5">
        <div className="flex gap-4">
          <TableFilter filterFields={filterFields} onFilterChange={setFilters} />
          <Input
            value={searchQuery}
            name="standardSearch"
            placeholder="Search standards..."
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            icon={<SearchIcon width={17} />}
            iconPosition="left"
            variant="searchTable"
          />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-7">
        {data?.standards?.edges?.map((standard) => (
          <Card key={standard?.node?.id} className="w-full max-w-xl bg-card p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-base">{standard?.node?.shortName}</h3>
                <span className="text-xs">version: {standard?.node?.version}</span>
              </div>
              {standard?.node?.governingBodyLogoURL && <img src={standard?.node?.governingBodyLogoURL} alt="logo" className="h-8" />}
            </div>
            <div className="text-sm space-y-1 mb-3">
              <p className="flex items-center gap-1">
                <SettingsIcon className="text-brand" size={16} /> {standard?.node?.standardType}
              </p>
              <p className="flex items-center gap-1">
                <Settings2 className="text-brand" size={16} /> Controls: {standard?.node?.controls.totalCount}
              </p>
              <p className="flex items-center gap-1">
                <CheckCircleIcon className="text-brand" size={16} /> Last updated: {formatDateSince(standard?.node?.updatedAt)}
              </p>
            </div>
            <div className="border-t pt-3 mb-3 flex flex-wrap gap-2">
              {standard?.node?.tags?.map((tag, index) => (
                <Badge key={index} variant="outline" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-sm mb-4 line-clamp-3 overflow-hidden text-ellipsis">{standard?.node?.description}</p>
            <Link href={`standards/${standard?.node?.id}`}>
              <Button className="mt-auto py-2 px-4 rounded">Details</Button>
            </Link>
          </Card>
        ))}
        <Card className="w-full max-w-xl bg-card p-28 rounded-lg shadow border border-dashed flex flex-col items-center justify-center text-center h-[350px]">
          <p className="mb-4">Looking for a framework that’s not supported yet? Reach out with the details.</p>
          <a href={INFO_EMAIL}>
            <Button variant="outline" className="!text-brand">
              info@theopenlane.io
            </Button>
          </a>
        </Card>
      </div>
    </>
  )
}

export default StandardsPage
