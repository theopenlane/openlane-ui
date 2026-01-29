'use client'

import React from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { CheckCheck, SearchIcon } from 'lucide-react'
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
}

const NdaRequestsTableToolbar: React.FC<Props> = ({ activeTab, onTabChange, searchTerm, setSearchTerm, onFilterChange, onApproveAll, onApproveAllRequest, approveAllLoading, approveAllDisabled }) => {
  const showApproveAll = activeTab === 'requested'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 my-3 w-full">
      <div className="flex flex-wrap items-center gap-3 grow sm:grow-0">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as typeof activeTab)}>
          <TabsList className="grid w-full max-w-[320px] grid-cols-3">
            <TabsTrigger value="requested">Requested</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
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
      </div>
    </div>
  )
}

export default NdaRequestsTableToolbar
