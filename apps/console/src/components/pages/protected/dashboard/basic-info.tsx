'use client'

import { formatDate } from '@/utils/date'
import { Card } from '@repo/ui/cardpanel'

interface BasicInformationProps {
  name?: string | null
  startDate?: string | null
  endDate?: string | null
  description?: string | null
}

const BasicInformation = ({ name, startDate, endDate, description }: BasicInformationProps) => {
  const formattedStartDate = formatDate(startDate)
  const formattedEndDate = formatDate(endDate)
  return (
    <Card className="p-8 w-full">
      <h2 className="text-lg font-semibold mb-4">Basic information</h2>
      <div className="space-y-3 text-sm">
        <div className="flex border-b pb-2.5">
          <span className="block w-32">Name:</span> <span>{name || '—'}</span>
        </div>
        <div className="flex border-b pb-2.5">
          <span className="block w-32">Start Date:</span> <span>{formattedStartDate}</span>
        </div>
        <div className="flex border-b pb-2.5">
          <span className="block w-32">End Date:</span> <span>{formattedEndDate}</span>
        </div>
        <div className="flex pb-2.5">
          <span className="block w-32">Description:</span> <span>{description || '—'}</span>
        </div>
      </div>
    </Card>
  )
}

export default BasicInformation
