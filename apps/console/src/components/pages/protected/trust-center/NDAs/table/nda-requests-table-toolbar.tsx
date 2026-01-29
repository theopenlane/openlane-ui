'use client'

import React from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { CheckCheck, SearchIcon, SlidersHorizontal } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'

type Props = {
  activeTab: 'requested' | 'approved' | 'signed'
  onTabChange: (value: 'requested' | 'approved' | 'signed') => void
  searchTerm: string
  setSearchTerm: (value: string) => void
  onFiltersClick?: () => void
}

const NdaRequestsTableToolbar: React.FC<Props> = ({ activeTab, onTabChange, searchTerm, setSearchTerm, onFiltersClick }) => {
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
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" className="w-60" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" icon={<SlidersHorizontal size={16} />} iconPosition="left" onClick={onFiltersClick}>
          Filters
        </Button>
        {showApproveAll && (
          <Button icon={<CheckCheck size={16} />} iconPosition="left">
            Approve All
          </Button>
        )}
      </div>
    </div>
  )
}

export default NdaRequestsTableToolbar
