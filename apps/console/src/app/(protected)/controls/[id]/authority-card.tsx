'use client'

import React from 'react'
import { Avatar } from '@/components/shared/avatar/avatar'
import { ControlFieldsFragment, Group } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight } from 'lucide-react'

interface AuthorityCardProps {
  controlOwner: ControlFieldsFragment['controlOwner']
  delegate: ControlFieldsFragment['delegate']
}

const AuthorityCard: React.FC<AuthorityCardProps> = ({ controlOwner, delegate }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <CircleUser size={16} className="text-brand" />
            <span className="text-muted-foreground">Owner</span>
          </div>
          <div className="flex gap-2">
            <Avatar entity={controlOwner as Group} variant="small" />
            <span>{controlOwner?.displayName}</span>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <CircleArrowRight size={16} className="text-brand" />
            <span className="text-muted-foreground">Delegate</span>
          </div>
          <div className="flex gap-2">
            <Avatar entity={delegate as Group} variant="small" />
            <span>{delegate?.displayName}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default AuthorityCard
