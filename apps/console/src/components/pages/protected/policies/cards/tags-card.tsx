'use client'

import React from 'react'
import { ControlFieldsFragment, Group } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { Binoculars, ScanEye, Stamp, ClockArrowUp, FileStack, ScrollText, Calendar } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'

const TagsCard: React.FC = () => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Status */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Binoculars size={16} className="text-brand" />
            <span>Status</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Approval Required */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <ScanEye size={16} className="text-brand" />
            <span>Approval Required</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Set Approval group */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Stamp size={16} className="text-brand" />
            <span>Set approval group</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Reviewing Frequency */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <ClockArrowUp size={16} className="text-brand" />
            <span>Reviewing Frequency</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Version */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <FileStack size={16} className="text-brand" />
            <span>Version</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Policy type */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <ScrollText size={16} className="text-brand" />
            <span>Policy Type</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Policy type */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Calendar size={16} className="text-brand" />
            <span>Set review date</span>
          </div>

          <div className="flex gap-2"></div>
        </div>
      </div>
    </Card>
  )
}

export default TagsCard
