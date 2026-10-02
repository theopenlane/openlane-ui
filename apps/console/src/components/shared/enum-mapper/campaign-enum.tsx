import { CalendarClock, Circle, CircleCheck, CircleDot, CircleHelp, CircleOff } from 'lucide-react'
import { CampaignCampaignStatus } from '@repo/codegen/src/schema'
import React from 'react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const CampaignStatusIconMapper: Record<CampaignCampaignStatus, React.ReactNode> = {
  [CampaignCampaignStatus.ACTIVE]: <CircleDot height={16} width={16} className="text-in-progress" />,
  [CampaignCampaignStatus.SCHEDULED]: <CalendarClock height={16} width={16} className="text-in-review" />,
  [CampaignCampaignStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed" />,
  [CampaignCampaignStatus.CANCELED]: <CircleOff height={16} width={16} className="text-wont-do" />,
  [CampaignCampaignStatus.DRAFT]: <Circle height={16} width={16} className="text-muted-foreground" />,
}

const UNKNOWN_CAMPAIGN_STATUS_ICON = <CircleHelp height={16} width={16} className="text-muted-foreground" />

export const CampaignStatusIcon = ({ status }: { status: CampaignCampaignStatus }) => <>{CampaignStatusIconMapper[status] ?? UNKNOWN_CAMPAIGN_STATUS_ICON}</>

export const CampaignStatusLabel = ({ status }: { status: CampaignCampaignStatus }) => (
  <div className="flex items-center gap-2">
    <CampaignStatusIcon status={status} />
    <span>{getEnumLabel(status)}</span>
  </div>
)
