import { CalendarClock, Circle, CircleCheck, CircleDot, CircleOff } from 'lucide-react'
import { CampaignCampaignStatus } from '@repo/codegen/src/schema'
import React from 'react'

export const CampaignStatusIconMapper: Record<CampaignCampaignStatus, React.ReactNode> = {
  [CampaignCampaignStatus.ACTIVE]: <CircleDot height={16} width={16} className="text-in-progress" />,
  [CampaignCampaignStatus.SCHEDULED]: <CalendarClock height={16} width={16} className="text-in-review" />,
  [CampaignCampaignStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed" />,
  [CampaignCampaignStatus.CANCELED]: <CircleOff height={16} width={16} className="text-wont-do" />,
  [CampaignCampaignStatus.DRAFT]: <Circle height={16} width={16} className="text-muted-foreground" />,
}
