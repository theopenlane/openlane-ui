'use client'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { GetAllStandardsQuery } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import React, { useContext, useEffect } from 'react'
import MyFrameworksStats from './my-framework-stats'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { saveFilters, TFilterState } from '@/components/shared/table-filter/filter-storage'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'

type MyFrameworksProps = {
  standardsData?: GetAllStandardsQuery['standards']['edges']
}

const MyFrameworks: React.FC<MyFrameworksProps> = ({ standardsData }: MyFrameworksProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Coverage', href: '/standards?page=coverage' },
    ])
  }, [setCrumbs])

  const handleClick = (page: string) => {
    const params = new URLSearchParams(searchParams.get('page') ?? '')
    params.delete('coverage')
    params.set('page', page.toString())

    router.push(`?${params.toString()}`)
  }

  const handleOpenFilteredControls = (id: string) => {
    const filters: TFilterState = {
      standardIDIn: [id],
    }

    saveFilters(TableFilterKeysEnum.CONTROL, filters)
    router.push('/controls')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <PageHeading heading="Framework Coverage" />
        <Button variant="primary" className="h-8 px-2! pl-3" onClick={() => handleClick('standardsCatalog')}>
          Go To Standards Catalog
        </Button>
      </div>
      <div className="my-2 grid gap-7 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
        {standardsData?.map((standard) => {
          const standardItem = standard?.node
          if (!standardItem) return
          return (
            <Card key={standard?.node?.id}>
              <CardContent>
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <StandardsIconMapper key={standardItem.id} shortName={standardItem.shortName ?? ''} />
                    <p className="text-lg font-medium text-muted-foreground">{standardItem?.shortName}</p>
                  </div>
                  <MyFrameworksStats standardId={standardItem.id} isSystemOwned={standardItem.systemOwned} />
                  <Button onClick={() => handleOpenFilteredControls(standardItem.id)} variant="primary" className="py-2 px-4">
                    View Controls
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default MyFrameworks
