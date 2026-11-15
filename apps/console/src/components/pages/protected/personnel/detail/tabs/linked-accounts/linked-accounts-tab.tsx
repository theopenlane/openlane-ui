'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef, type VisibilityState } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetIdentityHolderDirectoryAccounts } from '@/lib/graphql-hooks/identity-holder'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { Input } from '@repo/ui/input'
import { SearchIcon, Settings } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { createRowActionsColumn } from '@/components/shared/crud-base/columns/row-actions-column'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { buildMembershipList, membershipInstallationIds, resolveInstallationVendor } from '@/lib/directory-memberships/group-memberships'
import { LINKED_ACCOUNT_COLUMNS, renderExpandedRow, type DirectoryAccountRow } from './linked-accounts-columns'
import { dedupeDirectoryAccounts } from './dedupe-directory-accounts'
import { useVendorsByInstallation } from '@/lib/graphql-hooks/entity'
import { useCanManageIntegrations } from '@/lib/authz/use-can-manage-integrations'
import { DirectoryMembershipDirectoryMembershipRole, type DirectoryMembershipWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import { defineFilterFields } from '@/types'

interface LinkedAccountsTabProps {
  personnelId: string
}

const roleOptions = enumToOptions(DirectoryMembershipDirectoryMembershipRole)

const MEMBERSHIP_FILTER_FIELDS = defineFilterFields<DirectoryMembershipWhereInput>()([
  {
    key: 'roleIn',
    label: 'Role',
    type: 'multiselect',
    icon: FilterIcons.Access,
    options: roleOptions,
  },
])

const LinkedAccountsTab: React.FC<LinkedAccountsTabProps> = ({ personnelId }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [membershipFilter, setMembershipFilter] = useState<WhereCondition | null>(null)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS, {}))

  const where = useMemo(
    () =>
      debouncedSearch
        ? {
            or: [
              { directoryNameContainsFold: debouncedSearch },
              { sourceInstanceIDContainsFold: debouncedSearch },
              { displayNameContainsFold: debouncedSearch },
              { canonicalEmailContainsFold: debouncedSearch },
            ],
          }
        : undefined,
    [debouncedSearch],
  )

  const membershipWhere: DirectoryMembershipWhereInput | undefined = !membershipFilter || Object.keys(membershipFilter).length === 0 ? undefined : (membershipFilter as DirectoryMembershipWhereInput)

  const { directoryAccounts: allDirectoryAccounts, isLoading } = useGetIdentityHolderDirectoryAccounts(personnelId, where, membershipWhere, membershipFilter !== null)
  const directoryAccounts = useMemo(() => dedupeDirectoryAccounts(allDirectoryAccounts), [allDirectoryAccounts])

  const { canManageIntegrations } = useCanManageIntegrations()
  const columns = useMemo<ColumnDef<DirectoryAccountRow>[]>(
    () =>
      canManageIntegrations
        ? [
            ...LINKED_ACCOUNT_COLUMNS,
            createRowActionsColumn<DirectoryAccountRow>({
              actions: [
                {
                  label: 'Configure integration',
                  icon: <Settings size={16} />,
                  onClick: (row) => {
                    if (row.integrationDefinitionId) {
                      router.push(`/automation/integrations/${row.integrationDefinitionId}`)
                    }
                  },
                  disabled: (row) => !row.integrationDefinitionId,
                },
              ],
            }),
          ]
        : LINKED_ACCOUNT_COLUMNS,
    [router, canManageIntegrations],
  )

  const mappedColumns = useMemo(() => getMappedColumns(columns), [columns])

  const installationIds = useMemo(
    () => directoryAccounts.flatMap((account) => [...(account.managedBy ? [account.managedBy] : []), ...membershipInstallationIds(account.memberships)]),
    [directoryAccounts],
  )
  const vendorsByInstallation = useVendorsByInstallation(installationIds)

  const rows: DirectoryAccountRow[] = useMemo(
    () =>
      directoryAccounts.map((account) => ({
        id: account.id,
        directory: account.directoryName || null,
        sourceInstanceId: account.sourceInstanceID || null,
        accountType: account.accountType ?? '',
        status: account.status,
        mfaState: account.mfaState,
        primarySource: account.primarySource,
        integrationDefinitionId: account.sourceDefinitionID || null,
        vendor: resolveInstallationVendor(account.managedBy, vendorsByInstallation),
        memberships: buildMembershipList(account.memberships, vendorsByInstallation),
      })),
    [directoryAccounts, vendorsByInstallation],
  )

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS} />
          <TableFilter filterFields={MEMBERSHIP_FILTER_FIELDS} onFilterChange={setMembershipFilter} pageKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.PERSONNEL_LINKED_ACCOUNTS}
        renderExpandedRow={renderExpandedRow}
        getRowId={(row) => row.id}
      />
    </div>
  )
}

export default LinkedAccountsTab
