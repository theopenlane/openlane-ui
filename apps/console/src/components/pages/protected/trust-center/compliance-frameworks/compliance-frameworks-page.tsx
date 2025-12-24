'use client'

import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useRouter } from 'next/navigation'
import { useGetTrustCenterCompliances, useCreateTrustCenterCompliance, useDeleteTrustCenterCompliance } from '@/lib/graphql-hooks/trust-center-compliance'
import { Badge } from '@repo/ui/badge'

import { CreateStandardSheet } from './sheet/create-standard-sheet'
import { useGetAllStandardsInfinite } from '@/lib/graphql-hooks/standards'
import { Card, CardContent, CardHeader } from '@repo/ui/cardpanel'
import { Switch } from '@repo/ui/switch'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import { TPagination } from '@repo/ui/pagination-types'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { PencilIcon } from 'lucide-react'
import Link from 'next/link'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Image from 'next/image'

export default function ComplianceFrameworksPage() {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const router = useRouter()

  const [cardPagination, setCardPagination] = useState<TPagination>(CARD_DEFAULT_PAGINATION)

  const {
    standards,
    isError: standardsError,
    paginationMeta,
    fetchNextPage,
  } = useGetAllStandardsInfinite({
    pagination: cardPagination,
    enabled: true,
  })

  const { compliances, isLoading: compliancesLoading, isError: compliancesError, isFetched } = useGetTrustCenterCompliances()

  const loading = compliancesLoading || paginationMeta.isLoading
  const hasError = standardsError || compliancesError

  const { mutateAsync: createCompliance } = useCreateTrustCenterCompliance()
  const { mutateAsync: deleteCompliance } = useDeleteTrustCenterCompliance()

  const { errorNotification } = useNotification()

  const complianceMap = useMemo(() => {
    const map = new Map<string, string>()
    compliances?.forEach((c) => {
      if (c?.standard?.id && c?.id) {
        map.set(c.standard.id, c.id)
      }
    })
    return map
  }, [compliances])

  const handleToggle = useCallback(
    async (standardID: string, checked: boolean) => {
      const complianceID = complianceMap.get(standardID)

      try {
        if (checked) {
          await createCompliance({ input: { standardID } })
        } else if (complianceID) {
          await deleteCompliance({
            deleteTrustCenterComplianceId: complianceID,
          })
        }
      } catch (err: unknown) {
        const errorMessage = parseErrorMessage(err)
        errorNotification({
          title: 'Error updating compliance',
          description: errorMessage,
        })
      }
    },
    [createCompliance, deleteCompliance, complianceMap, errorNotification],
  )

  const handlePaginationChange = (pagination: TPagination) => {
    setCardPagination(pagination)
  }

  useEffect(() => {
    if (cardPagination.page === 1) return
    if (!paginationMeta.pageInfo?.hasNextPage) return
    fetchNextPage()
  }, [cardPagination.page, fetchNextPage, paginationMeta.pageInfo?.hasNextPage])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Compliance Frameworks', href: '/trust-center/compliance-frameworks' }])
  }, [setCrumbs])

  const resetPagination = () => {
    setCardPagination({ ...CARD_DEFAULT_PAGINATION })
  }

  if (loading && !isFetched) return <Loading />

  if (hasError) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error loading frameworks.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
        <h2 className="text-2xl font-semibold">Compliance Frameworks</h2>

        <Button variant="secondary" onClick={() => router.push('/trust-center/compliance-frameworks?create=true')}>
          Create Custom Framework
        </Button>
      </div>

      <InfiniteScroll pageSize={10} pagination={cardPagination} onPaginationChange={handlePaginationChange} paginationMeta={paginationMeta} key="standards-card">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {standards.map((standard) => {
            if (!standard) return null

            const complianceID = complianceMap.get(standard.id)
            const isAssociated = !!complianceID

            return (
              <Card key={standard.id} className="transition p-6">
                <CardHeader className="flex flex-row justify-between items-center p-0 space-y-2">
                  <div className="flex gap-3 items-center">
                    {standard.systemOwned ? (
                      <StandardsIconMapper height={28} width={28} key={standard?.id} shortName={standard?.shortName ?? ''} />
                    ) : (
                      <>{standard.logoFile?.presignedURL && <Image src={standard.logoFile?.presignedURL} alt="logo" width={28} height={28}></Image>}</>
                    )}
                    <p>{standard.shortName}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {standard.systemOwned ? <Badge className="bg-primary">Provided</Badge> : <Badge variant="outline">Custom</Badge>}
                    {!standard.systemOwned && (
                      <Link href={`/trust-center/compliance-frameworks?id=${standard.id}`} className="w-fit">
                        <Button className="p-2 h-8" variant="secondary">
                          <PencilIcon />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex p-0  gap-6 justify-between h-16">
                  <p className="text-sm text-muted-foreground line-clamp-3">{standard.description || 'No description provided'}</p>

                  <div className="mt-4 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-end gap-3">
                      <Switch checked={isAssociated} onCheckedChange={(checked) => handleToggle(standard.id, checked)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </InfiniteScroll>
      <CreateStandardSheet resetPagination={resetPagination} />
    </div>
  )
}
