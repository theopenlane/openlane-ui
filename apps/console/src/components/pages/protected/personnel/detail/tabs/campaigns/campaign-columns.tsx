import React from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { type ColumnDef, type VisibilityState } from '@repo/ui/table-types'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { CampaignCampaignType } from '@repo/codegen/src/schema'
import { type CampaignTargetWithCampaign } from '@/lib/graphql-hooks/campaign-target'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CampaignStatusLabel } from '@/components/shared/enum-mapper/campaign-enum'
import { AssessmentResponseStatusLabel } from '@/components/shared/enum-mapper/assessment-response-enum'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { describeCampaignRecurrence } from '@/components/pages/protected/campaigns/recurrence/campaign-recurrence'

type Campaign = NonNullable<CampaignTargetWithCampaign['campaign']>

export type PersonnelCampaignRow = Pick<CampaignTargetWithCampaign, 'id' | 'email' | 'status' | 'sentAt' | 'completedAt' | 'createdAt'> & {
  campaign: Campaign | null
  name: string
  campaignType: CampaignCampaignType | null
  description: string | null
  campaignStatus: Campaign['status'] | null
  dueDate: string | null
  recurrence: string
}

export const toPersonnelCampaignRow = (target: CampaignTargetWithCampaign): PersonnelCampaignRow => ({
  id: target.id,
  email: target.email,
  status: target.status,
  sentAt: target.sentAt,
  completedAt: target.completedAt,
  createdAt: target.createdAt,
  campaign: target.campaign,
  name: target.campaign?.name ?? '',
  campaignType: target.campaign?.campaignType ?? null,
  description: target.campaign?.description ?? null,
  campaignStatus: target.campaign?.status ?? null,
  dueDate: target.campaign?.dueDate ?? null,
  recurrence: target.campaign ? describeCampaignRecurrence(target.campaign) : '-',
})

const CampaignTypeCell: React.FC<{ campaign: Campaign | null }> = ({ campaign }) => {
  if (!campaign) return <span>-</span>

  const label = getEnumLabel(campaign.campaignType)
  const assessment = campaign.assessment

  if (campaign.campaignType !== CampaignCampaignType.QUESTIONNAIRE || !assessment) return <span>{label}</span>

  return (
    <SystemTooltip
      portal
      content={`Questionnaire: ${assessment.name}`}
      icon={
        <a
          href={getHrefForObjectType('assessments', { id: assessment.id })}
          target="_blank"
          rel="noreferrer"
          aria-label={`${label}: ${assessment.name}`}
          className="inline-flex items-center gap-1 align-middle text-blue-500 hover:underline"
        >
          {label}
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      }
    />
  )
}

const DescriptionCell: React.FC<{ description: string | null }> = ({ description }) => {
  if (!description) return <span>-</span>

  return <SystemTooltip portal content={description} icon={<span className="line-clamp-2 whitespace-normal break-words">{description}</span>} />
}

export const PERSONNEL_CAMPAIGN_HIDDEN_COLUMNS = {
  campaignStatus: false,
  dueDate: false,
  recurrence: false,
  email: false,
  createdAt: false,
} satisfies VisibilityState

export const personnelCampaignColumns: ColumnDef<PersonnelCampaignRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 220,
    cell: ({ row }) =>
      row.original.campaign ? (
        <Link href={getHrefForObjectType('campaigns', { id: row.original.campaign.id })} className="block truncate text-blue-500 hover:underline">
          {row.original.name}
        </Link>
      ) : (
        <span>-</span>
      ),
  },
  {
    accessorKey: 'campaignType',
    header: 'Campaign Type',
    size: 170,
    cell: ({ row }) => <CampaignTypeCell campaign={row.original.campaign} />,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 280,
    cell: ({ row }) => <DescriptionCell description={row.original.description} />,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cell: ({ row }) => <AssessmentResponseStatusLabel status={row.original.status} />,
  },
  {
    accessorKey: 'sentAt',
    header: 'Sent At',
    size: 170,
    cell: ({ row }) => <DateCell value={row.original.sentAt} />,
  },
  {
    accessorKey: 'completedAt',
    header: 'Completed At',
    size: 170,
    cell: ({ row }) => <DateCell value={row.original.completedAt} />,
  },
  {
    accessorKey: 'campaignStatus',
    header: 'Campaign Status',
    size: 150,
    cell: ({ row }) => (row.original.campaignStatus ? <CampaignStatusLabel status={row.original.campaignStatus} /> : <span>-</span>),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    size: 170,
    cell: ({ row }) => <DateCell value={row.original.dueDate} />,
  },
  {
    accessorKey: 'recurrence',
    header: 'Recurrence',
    size: 150,
    cell: ({ row }) => <span>{row.original.recurrence}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Sent To',
    size: 220,
    cell: ({ row }) => <span className="block truncate">{row.original.email}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Added At',
    size: 170,
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
]
