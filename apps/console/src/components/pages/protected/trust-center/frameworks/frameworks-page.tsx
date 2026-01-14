'use client'

import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useCreateBulkTrustCenterCompliance, useDeleteBulkTrustCenterCompliance, useGetTrustCenterCompliances } from '@/lib/graphql-hooks/trust-center-compliance'
import { Badge } from '@repo/ui/badge'
import { useDeleteStandard, useGetAllStandardsInfinite, useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Switch } from '@repo/ui/switch'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import { TPagination } from '@repo/ui/pagination-types'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { BookUp2, PencilIcon, SquarePlus, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Image from 'next/image'
import { StandardDialog } from './create-framework-dialog/create-framework-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Label } from '@repo/ui/label'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { StandardWhereInput } from '@repo/codegen/src/schema'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

export default function FrameworksPage() {
  const { successNotification, errorNotification } = useNotification()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { currentOrgId } = useOrganization()

  const [cardPagination, setCardPagination] = useState<TPagination>(CARD_DEFAULT_PAGINATION)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [standardToDelete, setStandardToDelete] = useState<string | null>(null)
  const [draftData, setDraftData] = useState<{ standardID: string; value: boolean }[]>([])
  const [isChecked, setIsChecked] = useState(false)

  const { mutateAsync: deleteStandard } = useDeleteStandard()
  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenter = trustCenterData?.trustCenters?.edges?.[0]?.node
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''

  const { compliances, isLoading: compliancesLoading, isError: compliancesError, isFetched } = useGetTrustCenterCompliances()
  const where: StandardWhereInput = isChecked ? { hasTrustCenterCompliancesWith: [{ trustCenterID }] } : {}

  const {
    standards,
    isError: standardsError,
    paginationMeta,
    fetchNextPage,
  } = useGetAllStandardsInfinite({
    where,
    pagination: cardPagination,
  })

  const loading = compliancesLoading || paginationMeta.isLoading
  const hasError = standardsError || compliancesError

  const { mutateAsync: createBulkCompliance, isPending: isCreatingBulk } = useCreateBulkTrustCenterCompliance()
  const { mutateAsync: deleteBulkCompliance, isPending: isDeletingBulk } = useDeleteBulkTrustCenterCompliance()

  const { data: recommendedStandardsData } = useStandardsSelect({
    where: {
      hasControlsWith: [
        {
          hasOwnerWith: [
            {
              id: currentOrgId,
            },
          ],
        },
      ],
    },
  })

  const recommendedStandardsIDs = useMemo(() => recommendedStandardsData?.standards?.edges?.map((e) => e?.node?.id), [recommendedStandardsData])

  const isDirty = useMemo(() => !!draftData.length, [draftData])

  const publishDisabled = !isDirty || isCreatingBulk || isDeletingBulk

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
    (standardID: string, checked: boolean) => {
      const isAlreadyAdded = draftData.find((data) => data.standardID === standardID)
      if (isAlreadyAdded) {
        return setDraftData((prev) => prev.filter((d) => d.standardID !== standardID))
      }
      setDraftData((prev) => [...prev, { standardID, value: checked }])
    },
    [draftData],
  )

  const handlePublish = useCallback(async () => {
    const createStandardIDs: string[] = []
    const deleteComplianceIDs: string[] = []

    try {
      draftData.forEach(({ standardID, value }) => {
        if (value) {
          createStandardIDs.push(standardID)
          return
        }

        const complianceID = complianceMap.get(standardID)
        if (complianceID) {
          deleteComplianceIDs.push(complianceID)
        }
      })

      if (createStandardIDs.length) {
        await createBulkCompliance({
          input: createStandardIDs.map((standardID) => ({
            standardID,
            trustCenterID,
          })),
        })
      }

      if (deleteComplianceIDs.length) {
        await deleteBulkCompliance({ ids: deleteComplianceIDs })
      }

      successNotification({
        title: 'Published',
        description: 'Framework selections have been published.',
      })
      setTimeout(() => {
        setDraftData([])
      }, 100)
    } catch (err) {
      errorNotification({
        title: 'Error publishing',
        description: parseErrorMessage(err),
      })
    }
  }, [draftData, complianceMap, createBulkCompliance, deleteBulkCompliance, trustCenterID, successNotification, errorNotification])

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

  const navGuard = useNavigationGuard({ enabled: isDirty })

  if (loading && !isFetched) return <Loading />

  if (hasError) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error loading frameworks.</p>
      </div>
    )
  }

  if (!trustCenter) {
    return <div className="p-6">No trust center settings found.</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col mr-6">
          <h2 className="text-2xl font-semibold">Frameworks</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Only enable frameworks your organization has completed through an audit or certification. Enabled frameworks are displayed publicly in your Trust Center.
          </p>
        </div>

        <div className="flex items-center shrink-0 gap-6 ">
          <div className="gap-2 flex items-center">
            <Switch id="hide-unselected" checked={isChecked} onCheckedChange={setIsChecked} />
            <Label className="text-sm" htmlFor="hide-unselected">
              Hide unselected
            </Label>
          </div>

          <div className="flex gap-2">
            <Button icon={<BookUp2 />} iconPosition="left" variant="secondary" disabled={publishDisabled} onClick={handlePublish}>
              Publish
            </Button>

            <StandardDialog
              resetPagination={resetPagination}
              trigger={
                <Button icon={<SquarePlus />} iconPosition="left">
                  Add Custom Framework
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <InfiniteScroll pageSize={10} pagination={cardPagination} onPaginationChange={handlePaginationChange} paginationMeta={paginationMeta} key="standards-card">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {standards.map((standard) => {
            if (!standard) return null

            const complianceID = complianceMap.get(standard.id)
            const defaultIsAssociated = !!complianceID
            const isAssociated = draftData.find((data) => data.standardID === standard.id)?.value ?? defaultIsAssociated

            return (
              <Card key={standard.id} className="transition p-6">
                <div className="flex flex-row items-center p-0 ">
                  <div className="flex gap-3 items-center">
                    {standard.systemOwned ? (
                      <StandardsIconMapper height={32} width={32} key={standard?.id} shortName={standard?.shortName ?? ''} />
                    ) : standard.logoFile?.presignedURL ? (
                      <Image src={standard.logoFile.presignedURL} alt="logo" width={32} height={32} />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/20" />
                    )}

                    <p className="text-base">{standard.shortName}</p>

                    <div className="flex gap-2 items-center">
                      {recommendedStandardsIDs?.includes(standard.id) && <Badge variant="green">Recommended</Badge>}

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
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <button
                                  disabled={defaultIsAssociated}
                                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => {
                                    setStandardToDelete(standard.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 size={16} className="text-muted-foreground" />
                                </button>
                              </TooltipTrigger>
                              {defaultIsAssociated && (
                                <TooltipContent side="top">
                                  <p className="max-w-[250px] text-xs">You must remove this and publish the trust center before you can delete the custom framework.</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="flex p-0 gap-6 justify-between h-16">
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
        onConfirm={handleDelete}
        title="Delete Standard"
        description="This action cannot be undone."
        confirmationText="Delete"
        confirmationTextVariant="destructive"
      />
      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </div>
  )
}
