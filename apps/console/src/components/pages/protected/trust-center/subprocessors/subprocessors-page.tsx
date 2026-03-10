'use client'

import React, { useCallback, use, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetTrustCenterSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessor'
import { ExportExportFormat, ExportExportType, type TrustCenterSubprocessorWhereInput, type User } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import SubprocessorsTableToolbar from './table/subprocessors-table-toolbar'
import { getSubprocessorsColumns, type SubprocessorTableItem } from './table/table-config'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { TableKeyEnum } from '@repo/ui/table-key'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import useFileExport from '@/components/shared/export/use-file-export'
import { EditTrustCenterSubprocessorSheet } from './sheet/edit-trust-center-subprocessor-sheet'
import { EmbedSubprocessorSheet } from './sheet/embed-subprocessor-sheet'
import { useGetTrustCenter, useUpdateTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { Input } from '@repo/ui/input'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Button } from '@repo/ui/button'
import { Code } from 'lucide-react'

const SubprocessorsPage = () => {
  const [embedSheetOpen, setEmbedSheetOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useStorageSearch(ObjectTypes.SUBPROCESSOR)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    getInitialVisibility(TableKeyEnum.TRUST_CENTER_SUBPROCESSORS, {
      id: false,
      createdBy: false,
      updatedAt: false,
      updatedBy: false,
      createdAt: false,
      description: false,
    }),
  )
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<TrustCenterSubprocessorWhereInput | null>(null)
  const [selectedRows, setSelectedRows] = useState<{ id: string }[]>([])
  const { handleExport } = useFileExport()

  const { setCrumbs } = use(BreadcrumbContext)

  const { successNotification, errorNotification } = useNotification()
  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterNode = trustCenterData?.trustCenters?.edges?.[0]?.node
  const trustCenterID = trustCenterNode?.id ?? ''
  const slug = trustCenterNode?.slug ?? ''
  const savedSubprocessorURL = trustCenterNode?.subprocessorURL ?? ''
  const [subprocessorURL, setSubprocessorURL] = useState(savedSubprocessorURL)

  const { mutateAsync: updateTrustCenter, isPending: isSavingURL } = useUpdateTrustCenter()

  useEffect(() => {
    setSubprocessorURL(savedSubprocessorURL)
  }, [savedSubprocessorURL])

  const handleSaveSubprocessorURL = async () => {
    const trimmed = subprocessorURL.trim()
    if (trimmed === savedSubprocessorURL) return

    try {
      await updateTrustCenter({
        updateTrustCenterId: trustCenterID,
        input: trimmed ? { subprocessorURL: trimmed } : { clearSubprocessorURL: true },
      })
      successNotification({ title: 'Saved', description: 'Subprocessor URL updated successfully.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const where = {
    ...(searchTerm ? { hasSubprocessorWith: [{ or: [{ nameContainsFold: searchTerm }, { descriptionContainsFold: searchTerm }] }] } : {}),
    ...(filters ?? {}),
  }

  const { trustCenterSubprocessors, paginationMeta, isLoading } = useGetTrustCenterSubprocessors({
    where,
    pagination,
  })

  const userIds = useMemo(() => {
    if (!trustCenterSubprocessors) return []
    const ids = new Set<string>()
    trustCenterSubprocessors.forEach((item) => {
      if (item?.createdBy) ids.add(item?.createdBy)
      if (item?.updatedBy) ids.add(item?.updatedBy)
    })
    return Array.from(ids)
  }, [trustCenterSubprocessors])

  const { users } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const handleFilterChange = useCallback((newFilters: TrustCenterSubprocessorWhereInput) => {
    setFilters(newFilters)
    setPagination(DEFAULT_PAGINATION)
  }, [])

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const tableData: SubprocessorTableItem[] = useMemo(
    () =>
      trustCenterSubprocessors.map((item) => ({
        id: item?.id ?? '',
        name: item?.subprocessor?.name ?? '',
        description: item?.subprocessor?.description ?? '',
        logo: item?.subprocessor?.logoFile?.presignedURL ?? item?.subprocessor?.logoRemoteURL ?? null,
        category: item?.trustCenterSubprocessorKindName ?? '',
        countries: item?.countries ?? [],
        createdAt: item?.createdAt ?? null,
        createdBy: item?.createdBy ?? null,
        updatedAt: item?.updatedAt ?? null,
        updatedBy: item?.updatedBy ?? null,
      })) ?? [],
    [trustCenterSubprocessors],
  )

  const { columns, mappedColumns } = useMemo(() => getSubprocessorsColumns({ selectedRows, setSelectedRows, userMap }), [selectedRows, userMap])

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExportFile = async () => {
    if (trustCenterSubprocessors.length === 0) {
      return
    }

    handleExport({
      exportType: ExportExportType.TRUST_CENTER_SUBPROCESSOR,
      filters: JSON.stringify(where),
      fields: columns.filter(isVisibleColumn).map((item) => (item.meta as { exportPrefix?: string })?.exportPrefix ?? item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Subprocessors', href: '/trust-center/subprocessors' }])
  }, [setCrumbs])

  return (
    <>
      <EditTrustCenterSubprocessorSheet />
      <EmbedSubprocessorSheet open={embedSheetOpen} onOpenChangeAction={setEmbedSheetOpen} slug={slug} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Subprocessors</h2>
          <Button variant="outline" icon={<Code size={16} />} iconPosition="left" onClick={() => setEmbedSheetOpen(true)}>
            Embed
          </Button>
        </div>

        <div className="flex flex-col justify-center mb-4 gap-3">
          <p className="text-sm font-medium">Fallback subprocessor list URL (optional)</p>
          <div className="flex items-center gap-2 max-w-md">
            <Input
              maxWidth
              type="url"
              placeholder="https://example.com/subprocessors"
              value={subprocessorURL}
              onChange={(e) => setSubprocessorURL(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSaveSubprocessorURL()
                }
              }}
            />
            <SaveButton onClick={handleSaveSubprocessorURL} disabled={isSavingURL || subprocessorURL.trim() === savedSubprocessorURL} isSaving={isSavingURL} className="h-9!" />
          </div>
          {tableData.length > 0 ? (
            <p className="text-sm text-muted-foreground">This Trust Center uses the subprocessors listed below. The fallback URL will only be used if this list is empty.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No subprocessors have been added yet. If you already maintain a public list of subprocessors, you can provide a fallback URL above. Otherwise, add subprocessors here to publish them
              directly from Openlane.
            </p>
          )}
        </div>

        <SubprocessorsTableToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          mappedColumns={mappedColumns}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          handleFilterChange={handleFilterChange}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          onExport={handleExportFile}
          exportEnabled={trustCenterSubprocessors.length === 0}
        />

        <DataTable
          columns={columns}
          data={tableData}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={paginationMeta}
          loading={isLoading}
          columnVisibility={columnVisibility}
          tableKey={TableKeyEnum.TRUST_CENTER_SUBPROCESSORS}
        />
      </div>
    </>
  )
}

export default SubprocessorsPage
