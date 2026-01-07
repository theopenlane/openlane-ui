'use client'

import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetTrustCenterCompliances, useCreateTrustCenterCompliance, useDeleteTrustCenterCompliance } from '@/lib/graphql-hooks/trust-center-compliance'
import { Badge } from '@repo/ui/badge'

import { useDeleteStandard, useGetAllStandardsInfinite } from '@/lib/graphql-hooks/standards'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Switch } from '@repo/ui/switch'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import { TPagination } from '@repo/ui/pagination-types'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { PencilIcon, SquarePlus, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Image from 'next/image'
import { StandardDialog } from './create-framework-dialog/create-framework-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

export default function FrameworksPage() {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { mutateAsync: deleteStandard } = useDeleteStandard()
  const { successNotification, errorNotification } = useNotification()
  const [standardToDelete, setStandardToDelete] = useState<string | null>(null)

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
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Frameworks', href: '/trust-center/frameworks' }])
  }, [setCrumbs])

  const resetPagination = () => {
    setCardPagination({ ...CARD_DEFAULT_PAGINATION })
  }

  const handleDelete = async () => {
    if (!standardToDelete) return
    try {
      resetPagination()
      await deleteStandard({ deleteStandardId: standardToDelete })

      successNotification({ title: 'Standard Deleted', description: 'The standard has been removed.' })
      setDeleteDialogOpen(false)
    } catch (err) {
      errorNotification({ title: 'Error deleting standard', description: parseErrorMessage(err) })
    }
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
      <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
        <h2 className="text-2xl font-semibold">Frameworks</h2>
        <div className="flex">
          <StandardDialog
            resetPagination={resetPagination}
            trigger={
              <Button icon={<SquarePlus />} iconPosition="left">
                Create Custom Framework
              </Button>
            }
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Only enable frameworks your organization has completed through an audit or certification. Enabled frameworks are displayed publicly in your Trust Center.
        </p>
      </div>

      <InfiniteScroll pageSize={10} pagination={cardPagination} onPaginationChange={handlePaginationChange} paginationMeta={paginationMeta} key="standards-card">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {standards.map((standard) => {
            if (!standard) return null

            const complianceID = complianceMap.get(standard.id)
            const isAssociated = !!complianceID

            return (
              <Card key={standard.id} className="transition p-6">
                <div className="flex flex-row items-center p-0 ">
                  <div className="flex gap-3 items-center">
                    {standard.systemOwned ? (
                      <StandardsIconMapper height={32} width={32} key={standard?.id} shortName={standard?.shortName ?? ''} />
                    ) : (
                      <>
                        {standard.logoFile?.presignedURL ? (
                          <Image src={standard.logoFile?.presignedURL} alt="logo" width={32} height={32}></Image>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/20"></div>
                        )}
                      </>
                    )}
                    <p className="text-base">{standard.shortName}</p>
                    <div className="flex gap-2 items-center">
                      {!!standard.systemOwned && <Badge variant={'green'}>Recommended</Badge>}
                      {!standard.systemOwned && (
                        <>
                          <Badge variant="blue">Custom</Badge>
                          <StandardDialog
                            resetPagination={resetPagination}
                            trigger={
                              <button>
                                <PencilIcon size={16} className="text-muted-foreground" />
                              </button>
                            }
                            standard={standard}
                          />
                          <button
                            onClick={() => {
                              setStandardToDelete(standard.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 size={16} className="text-muted-foreground" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="flex p-0  gap-6 justify-between h-16">
                  <p className="text-sm text-muted-foreground line-clamp-3">{standard.description || 'No description provided'}</p>

                  <div className="flex" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-3">
                      <Switch checked={isAssociated} onCheckedChange={(checked) => handleToggle(standard.id, checked)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </InfiniteScroll>
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Standard"
        description="This action cannot be undone."
        confirmationText="Delete"
        confirmationTextVariant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
