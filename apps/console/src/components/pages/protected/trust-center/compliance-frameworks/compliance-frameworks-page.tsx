'use client'

import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DataTable } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useRouter } from 'next/navigation'
import { useGetTrustCenterCompliances, useCreateTrustCenterCompliance, useDeleteTrustCenterCompliance } from '@/lib/graphql-hooks/trust-center-compliance'
import { ColumnDef } from '@tanstack/table-core'
import { Badge } from '@repo/ui/badge'
import { CreateStandardSheet } from './sheet/create-standard-sheet'
import { useGetAllStandardsTable } from '@/lib/graphql-hooks/standards'

type FrameworkRow = {
  id: string
  shortName: string
  description?: string | null
  tags: string[]
  systemOwned?: boolean
}

export default function ComplianceFrameworksPage() {
  const [showAllStandards, setShowAllStandards] = useState(false)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const router = useRouter()

  const { compliances, isLoading: compliancesLoading } = useGetTrustCenterCompliances()
  const { standards, isLoading: standardsLoading } = useGetAllStandardsTable()

  const { mutateAsync: createCompliance } = useCreateTrustCenterCompliance()
  const { mutateAsync: deleteCompliance } = useDeleteTrustCenterCompliance()

  const loading = compliancesLoading || standardsLoading

  const complianceMap = useMemo(() => {
    const map = new Map<string, string>()
    compliances?.forEach((c) => {
      if (c?.standard?.id && c?.id) map.set(c.standard.id, c.id)
    })
    return map
  }, [compliances])

  const tableData = useMemo<FrameworkRow[]>(() => {
    if (showAllStandards) {
      return (
        standards?.map((std) => ({
          id: std?.id ?? '',
          shortName: std?.shortName ?? '',
          description: std?.description ?? '',
          tags: std?.tags ?? [],
          systemOwned: std?.systemOwned ?? false,
        })) ?? []
      )
    }

    return (
      compliances?.map((comp) => ({
        id: comp?.standard?.id ?? '',
        shortName: comp?.standard?.shortName ?? '',
        description: comp?.standard?.description ?? '',
        tags: comp?.standard?.tags ?? [],
        systemOwned: comp?.standard?.systemOwned ?? false,
      })) ?? []
    )
  }, [showAllStandards, compliances, standards])

  const handleAdd = useCallback(
    async (standardID: string) => {
      await createCompliance({
        input: { standardID },
      })
    },
    [createCompliance],
  )

  const handleRemove = useCallback(
    async (complianceID: string) => {
      await deleteCompliance({
        deleteTrustCenterComplianceId: complianceID,
      })
    },
    [deleteCompliance],
  )

  const columns: ColumnDef<FrameworkRow>[] = useMemo(
    () => [
      {
        accessorKey: 'shortName',
        header: 'Framework',
        cell: ({ row }) => row.original.shortName ?? '',
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="line-clamp-3">{row.original.description || '—'}</div>,
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) =>
          row.original.tags?.map((tag) => (
            <Badge variant="outline" key={tag}>
              {tag}
            </Badge>
          )),
      },
      {
        accessorKey: 'systemOwned',
        header: 'Type',
        cell: ({ row }) => <Badge variant="secondary">{row.original.systemOwned ? 'System' : 'Custom'}</Badge>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const standardID = row.original.id
          const complianceID = complianceMap.get(standardID)
          const alreadyAssociated = !!complianceID

          return (
            <div className="flex gap-2">
              {alreadyAssociated ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(complianceID)
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdd(standardID)
                  }}
                >
                  Add
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [complianceMap, handleAdd, handleRemove],
  )

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center' },
      {
        label: 'Compliance Frameworks',
        href: '/trust-center/compliance-frameworks',
      },
    ])
  }, [setCrumbs])

  if (loading) return <Loading />

  return (
    <div className="p-4">
      <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
        <h2 className="text-2xl">Compliance Frameworks</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 ml-auto">
            <Checkbox checked={showAllStandards} onCheckedChange={(value) => setShowAllStandards(!!value)} />
            <span className="text-sm">Show all standards</span>
          </div>

          <Button variant="secondary" onClick={() => router.push('/trust-center/compliance-frameworks?create=true')}>
            Create Custom Framework
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={tableData} onRowClick={(row) => router.push(`/trust-center/compliance-frameworks?id=${row.id}`)} />

      <CreateStandardSheet />
    </div>
  )
}
