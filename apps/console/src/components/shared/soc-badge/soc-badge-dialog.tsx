'use client'

import React from 'react'
import { BadgeCheck } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { SocBadgePanel } from './soc-badge-panel'
import { SOC_BADGE_DESCRIPTION, SOC_BADGE_TITLE } from './soc-badge-config'
import { useSocBadgeAvailability } from '@/lib/graphql-hooks/soc-badge'

type TSocBadgeDialogProps = {
  surface: 'program' | 'standard' | 'trust-center-frameworks'
  className?: string
}

export const SocBadgeDialog: React.FC<TSocBadgeDialogProps> = ({ surface, className }) => {
  const { isAvailable } = useSocBadgeAvailability()

  if (!isAvailable) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className={className} icon={<BadgeCheck size={16} />} iconPosition="left" {...elementAnchor(surface, 'soc-badge')}>
          Get SOC Badge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{SOC_BADGE_TITLE}</DialogTitle>
          <DialogDescription>{SOC_BADGE_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <SocBadgePanel className="min-w-0" />
      </DialogContent>
    </Dialog>
  )
}
