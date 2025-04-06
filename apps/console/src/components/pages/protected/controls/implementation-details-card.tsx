'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { BinocularsIcon, StampIcon, CalendarSearch, CircleCheck } from 'lucide-react'

const detailIconsMap: Record<string, React.ReactNode> = {
  Status: <BinocularsIcon size={16} className="text-brand" />,
  Verified: <StampIcon size={16} className="text-brand" />,
  'Verification date': <CalendarSearch size={16} className="text-brand" />,
}

const ImplementationDetailsCard = ({ isEditing }: { isEditing: boolean }) => {
  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Implementation Details</h3>
      <div className="space-y-3">
        <ImplementationDetail label="Status" value="-" />
        <ImplementationDetail
          label="Verified"
          value={
            <div className="flex items-center gap-1">
              <CircleCheck className="w-4 h-4 text-green-500" /> Yes
            </div>
          }
        />
        <ImplementationDetail
          label="Verification date"
          value={new Date('2025-01-16').toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        />
      </div>
    </Card>
  )
}

export default ImplementationDetailsCard

const ImplementationDetail = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{detailIconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm">{value || '-'}</div>
  </div>
)
