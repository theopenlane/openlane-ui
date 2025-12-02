'use client'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { GetAllStandardsQuery } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import React from 'react'

type MyFrameworksProps = {
  standardsData?: GetAllStandardsQuery['standards']['edges']
}

const MyFrameworks: React.FC<MyFrameworksProps> = ({ standardsData }: MyFrameworksProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handleClick = (page: string) => {
    const params = new URLSearchParams(searchParams.get('page') ?? '')
    params.delete('myFrameworks')
    params.set('page', page.toString())

    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <PageHeading heading="My frameworks" />
        <Button variant="primary" className="h-8 !px-2 !pl-3" onClick={() => handleClick('standardsCatalog')}>
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
                    <p className="text-lg font-medium text-[#505F6F]">{standardItem?.shortName}</p>
                  </div>
                  {/* <MyFrameworksStats standardId={standardItem.id} isSystemOwned={standardItem.}/> */}
                  <Link href={`standards/${standardItem.id}`} className="mt-auto">
                    <Button variant="primary" className="py-2 px-4">
                      Details
                    </Button>
                  </Link>
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
