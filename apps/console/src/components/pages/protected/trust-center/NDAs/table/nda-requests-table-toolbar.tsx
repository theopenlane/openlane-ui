'use client'

import React from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { CheckCheck, SearchIcon, ShieldOff } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { WhereCondition } from '@/types'
import { ndaRequestsFilterFields } from './table-config'

type Props = {
  activeTab: 'requested' | 'approved' | 'signed'
  onTabChange: (value: 'requested' | 'approved' | 'signed') => void
  searchTerm: string
  setSearchTerm: (value: string) => void
  onFilterChange?: (filters: WhereCondition) => void
  onApproveAll?: () => void
  onApproveAllRequest?: () => void
  approveAllLoading?: boolean
  approveAllDisabled?: boolean
  requireApproval: boolean
  selectedCount?: number
  onRevokeAccessRequest?: () => void
  revokeLoading?: boolean
}

const NdaRequestsTableToolbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  searchTerm,
  setSearchTerm,
  onFilterChange,
  onApproveAll,
  onApproveAllRequest,
  approveAllLoading,
  approveAllDisabled,
  requireApproval,
  selectedCount = 0,
  onRevokeAccessRequest,
  revokeLoading,
}) => {
  const showApproveAll = requireApproval && activeTab === 'requested'
  const showRevokeAccess = activeTab === 'signed' && selectedCount > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 my-3 w-full">
      <div className="flex flex-wrap items-center gap-3 grow sm:grow-0">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as typeof activeTab)}>
          <TabsList className={`grid w-full ${requireApproval ? 'max-w-[400px] grid-cols-3' : 'max-w-[320px] grid-cols-2'}`}>
            <TabsTrigger value="requested">{requireApproval ? 'Needs Approval' : 'Requested'}</TabsTrigger>
            {requireApproval && <TabsTrigger value="approved">Approved</TabsTrigger>}
            <TabsTrigger value="signed">Signed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex items-center gap-2">
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" className="w-60" />
        <TableFilter filterFields={ndaRequestsFilterFields} onFilterChange={onFilterChange} pageKey={TableFilterKeysEnum.TRUST_CENTER_NDA_REQUESTS} />
        {showApproveAll && (
          <Button icon={<CheckCheck size={16} />} iconPosition="left" onClick={onApproveAllRequest ?? onApproveAll} loading={approveAllLoading} disabled={approveAllDisabled || approveAllLoading}>
            Approve All
          </Button>
        )}
        {showRevokeAccess && (
          <Button variant="destructive" icon={<ShieldOff size={16} />} iconPosition="left" onClick={onRevokeAccessRequest} loading={revokeLoading} disabled={revokeLoading}>
            Revoke Access ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  )
}

export default NdaRequestsTableToolbar
