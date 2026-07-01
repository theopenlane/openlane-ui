'use client'

import React, { useCallback, use, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import {
  useGetTrustCenterSubprocessors,
  useDeleteTrustCenterSubprocessor,
  useBulkDeleteTrustCenterSubprocessors,
  useFetchAllTrustCenterSubprocessorIds,
} from '@/lib/graphql-hooks/trust-center-subprocessor'
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
import { toBase64DataUri } from '@/lib/image-utils'
import { useNotification } from '@/hooks/useNotification'
import { Input } from '@repo/ui/input'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getBulkActionFailureDescription } from '@/components/shared/crud-base/bulk-action-feedback'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Button } from '@repo/ui/button'
import { Code } from 'lucide-react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import SubprocessorsModeToggle, { type SubprocessorMode } from './SubprocessorsModeToggle'
import { useSession } from 'next-auth/react'

const SubprocessorsPage = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const { handleExport } = useFileExport()

  const { setCrumbs } = use(BreadcrumbContext)

  const { successNotification, errorNotification } = useNotification()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canCreateSubprocessor = hasPermission(orgPermission?.roles, AccessEnum.CanCreateTrustCenterSubprocessor, session)
  const canEditSubprocessor = hasPermission(orgPermission?.roles, AccessEnum.CanEditTrustCenterSubprocessor, session)

  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterNode = trustCenterData?.trustCenters?.edges?.[0]?.node
  const trustCenterID = trustCenterNode?.id ?? ''
  const slug = trustCenterNode?.slug ?? ''
  const savedSubprocessorURL = trustCenterNode?.subprocessorURL ?? ''
  const [subprocessorURL, setSubprocessorURL] = useState(savedSubprocessorURL)
  const [mode, setMode] = useState<SubprocessorMode>(savedSubprocessorURL ? 'link' : 'manage')

  const { mutateAsync: updateTrustCenter, isPending: isSavingURL } = useUpdateTrustCenter()
  const { mutateAsync: deleteSubprocessor } = useDeleteTrustCenterSubprocessor()
  const { mutateAsync: bulkDeleteSubprocessors } = useBulkDeleteTrustCenterSubprocessors()
  const fetchAllSubprocessorIds = useFetchAllTrustCenterSubprocessorIds()

  useEffect(() => {
    setSubprocessorURL(savedSubprocessorURL)
    if (savedSubprocessorURL) {
      setMode('link')
    }
  }, [savedSubprocessorURL])

  useEffect(() => {
    setColumnVisibility((prev) => ({ ...prev, select: canEditSubprocessor }))
  }, [canEditSubprocessor])

  const persistSubprocessorURL = async (trimmed: string) => {
    await updateTrustCenter({
      updateTrustCenterId: trustCenterID,
      input: trimmed ? { subprocessorURL: trimmed } : { clearSubprocessorURL: true },
    })
  }

  const handleSaveSubprocessorURL = async () => {
    const trimmed = subprocessorURL.trim()
    if (trimmed === savedSubprocessorURL) return

    if (trimmed && managedCount > 0) {
      setSwitchConfirmOpen(true)
      return
    }

    try {
      await persistSubprocessorURL(trimmed)
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

  const { paginationMeta: managedMeta } = useGetTrustCenterSubprocessors({
    where: {},
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
  })
  const managedCount = managedMeta.totalCount

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
        logo: (item?.subprocessor?.logoFile?.base64 ? toBase64DataUri(item.subprocessor.logoFile.base64) : null) ?? item?.subprocessor?.logoRemoteURL ?? null,
        category: item?.trustCenterSubprocessorKindName ?? '',
        countries: item?.countries ?? [],
        createdAt: item?.createdAt ?? null,
        createdBy: item?.createdBy ?? null,
        updatedAt: item?.updatedAt ?? null,
        updatedBy: item?.updatedBy ?? null,
      })) ?? [],
    [trustCenterSubprocessors],
  )

  const handleEditSubprocessor = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set('id', id)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const { columns, mappedColumns } = useMemo(
    () => getSubprocessorsColumns({ selectedRows, setSelectedRows, userMap, canEditSubprocessor, onEdit: handleEditSubprocessor, onDelete: setDeleteId }),
    [selectedRows, userMap, canEditSubprocessor, handleEditSubprocessor],
  )

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

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteSubprocessor({ deleteTrustCenterSubprocessorId: deleteId })
      successNotification({ title: 'Subprocessor deleted' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setDeleteId(null)
    }
  }

  const handleSelectMode = (next: SubprocessorMode) => {
    if (next === mode) return

    if (next === 'link') {
      setMode('link')
      return
    }

    setMode('manage')
    if (savedSubprocessorURL) {
      setSubprocessorURL('')
      updateTrustCenter({ updateTrustCenterId: trustCenterID, input: { clearSubprocessorURL: true } }).catch((error) => {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      })
    }
  }

  const confirmSwitchToLink = async () => {
    const trimmed = subprocessorURL.trim()
    setIsSwitching(true)
    try {
      await persistSubprocessorURL(trimmed)

      const ids = await fetchAllSubprocessorIds({})
      if (ids.length > 0) {
        const result = await bulkDeleteSubprocessors({ ids })
        const payload = result.deleteBulkTrustCenterSubprocessor
        if (payload.notDeletedIDs.length > 0 || payload.error) {
          errorNotification({
            title: 'Switch failed',
            description: getBulkActionFailureDescription({
              failedCount: payload.notDeletedIDs.length,
              singular: 'subprocessor',
              fallback: payload.error ?? 'Some subprocessors were not deleted.',
            }),
          })
          return
        }
      }
      setSelectedRows([])
      setSwitchConfirmOpen(false)
      successNotification({ title: 'Switched to external page', description: 'External page set and managed subprocessors removed.' })
    } catch (error) {
      errorNotification({ title: 'Switch failed', description: parseErrorMessage(error) })
    } finally {
      setIsSwitching(false)
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'Subprocessors', href: '/trust-center/subprocessors' },
    ])
  }, [setCrumbs])

  return (
    <>
      <EditTrustCenterSubprocessorSheet />
      <EmbedSubprocessorSheet open={embedSheetOpen} onOpenChangeAction={setEmbedSheetOpen} slug={slug} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Subprocessors</h2>
          {mode === 'manage' && (
            <Button variant="outline" icon={<Code size={16} />} iconPosition="left" onClick={() => setEmbedSheetOpen(true)}>
              Embed
            </Button>
          )}
        </div>

        <SubprocessorsModeToggle value={mode} onChange={handleSelectMode} />

        {mode === 'manage' ? (
          <>
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
              canCreateSubprocessor={canCreateSubprocessor}
              canEditSubprocessor={canEditSubprocessor}
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
          </>
        ) : (
          <div className="flex flex-col justify-center gap-3 max-w-md">
            <p className="text-sm font-medium">External subprocessors page URL</p>
            <div className="flex items-center gap-2">
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
              <SaveButton onClick={handleSaveSubprocessorURL} disabled={isSavingURL || subprocessorURL.trim() === savedSubprocessorURL} isSaving={isSavingURL} className="h-9! w-56 px-5!" />
            </div>
            <p className="text-sm text-muted-foreground">Customers will be redirected to this URL instead of seeing a list in your Trust Center.</p>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Subprocessor"
        description={<>This action cannot be undone. This will permanently remove this subprocessor from your trust center.</>}
      />

      <ConfirmationDialog
        open={switchConfirmOpen}
        onOpenChange={setSwitchConfirmOpen}
        onConfirm={confirmSwitchToLink}
        loading={isSwitching}
        title="Switch to an external page?"
        description={
          <>
            You currently have <b>{managedCount}</b> subprocessor{managedCount === 1 ? '' : 's'} managed in Openlane. Saving this external page URL will permanently delete all of them. This cannot be
            undone.
            <br />
            <br />
            Customers will be redirected to the URL you provide instead of seeing a list in your Trust Center.
          </>
        }
        confirmationText={isSwitching ? 'Saving...' : 'Save URL and delete subprocessors'}
        confirmationTextVariant="destructive"
      />
    </>
  )
}

export default SubprocessorsPage
