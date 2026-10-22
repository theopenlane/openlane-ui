'use client'

import React from 'react'
import { CalendarDays, Building2, UserRoundCheck, ListChecks, FileCheck2, CircleCheckBig, CircleDashed, Copy } from 'lucide-react'
import { formatDate } from '@/utils/date'
import { useNotification } from '@/hooks/useNotification'
import { type GetProgramBasicInfoQuery } from '@repo/codegen/src/schema'
import { type ProgramEvidenceScopeStats } from '@/lib/graphql-hooks/program'
import { type WhereCondition } from '@/types'
import { SelectableStatCard } from '@/components/shared/selectable-stat-card/selectable-stat-card'
import { isAuditorStatFilterActive, type TAuditorStatFilterKey } from './table/table-config'

const CopyableEmail: React.FC<{ email: string }> = ({ email }) => {
  const { successNotification } = useNotification()

  const handleCopy = () => {
    navigator.clipboard.writeText(email)
    successNotification({ title: 'Copied to clipboard' })
  }

  return (
    <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground hover:text-foreground">
      <span className="truncate">{email}</span>
      <Copy size={14} className="shrink-0" />
    </button>
  )
}

type AuditorStatCardProps = {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  tooltip?: string
  isActive?: boolean
  onSelect?: () => void
}

const AuditorStatCard: React.FC<AuditorStatCardProps> = ({ icon, label, children, ...selectable }) => (
  <SelectableStatCard className="h-full w-full" cardClassName="p-4 flex flex-col gap-2 w-full" {...selectable}>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-base font-medium">{children}</div>
  </SelectableStatCard>
)

type AuditorStatCardsProps = {
  program?: GetProgramBasicInfoQuery['program'] | null
  evidenceStats?: ProgramEvidenceScopeStats
  reviewStats?: { completed: number; inProgress: number }
  filters: WhereCondition | null
  onSelectStat: (stat: TAuditorStatFilterKey) => void
}

const ICON_SIZE = 16

export const AuditorStatCards: React.FC<AuditorStatCardsProps> = ({ program, evidenceStats, reviewStats, filters, onSelectStat }) => {
  const selectableStat = (stat: TAuditorStatFilterKey) => ({ isActive: isAuditorStatFilterActive(filters, stat), onSelect: filters ? () => onSelectStat(stat) : undefined })
  const auditPeriod = program?.startDate || program?.endDate ? `${formatDate(program?.startDate, 'TBD')} – ${formatDate(program?.endDate, 'TBD')}` : '—'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AuditorStatCard icon={<CalendarDays size={ICON_SIZE} />} label="Audit Period">
        {auditPeriod}
      </AuditorStatCard>

      <AuditorStatCard icon={<Building2 size={ICON_SIZE} />} label="Audit Firm">
        {program?.auditFirm || '—'}
      </AuditorStatCard>

      <AuditorStatCard icon={<UserRoundCheck size={ICON_SIZE} />} label="Lead Auditor">
        <div className="flex flex-col gap-1">
          <span>{program?.auditor || '—'}</span>
          {program?.auditorEmail && <CopyableEmail email={program.auditorEmail} />}
        </div>
      </AuditorStatCard>

      <AuditorStatCard icon={<ListChecks size={ICON_SIZE} />} label="Controls in Scope" tooltip="Controls that have been implemented and are being audited during this audit period">
        <div className="flex flex-col gap-1">
          <span>{evidenceStats?.total ?? 0}</span>
          <span className="text-xs text-muted-foreground font-normal">
            {evidenceStats?.framework ?? 0} Framework · {evidenceStats?.organization ?? 0} Organization
          </span>
        </div>
      </AuditorStatCard>

      <AuditorStatCard icon={<FileCheck2 size={ICON_SIZE} />} label="Evidence Ready" tooltip="Evidence that is ready for review and not yet been approved" {...selectableStat('evidenceReady')}>
        {evidenceStats?.byGroup.readyForAuditor ?? 0}
      </AuditorStatCard>

      <AuditorStatCard icon={<CircleCheckBig size={ICON_SIZE} />} label="Reviews Completed" tooltip="Number of reviews completed" {...selectableStat('reviewsCompleted')}>
        {reviewStats?.completed ?? 0}
      </AuditorStatCard>

      <AuditorStatCard
        icon={<CircleDashed size={ICON_SIZE} />}
        label="Reviews In Progress"
        tooltip="Number of reviews that have been started but not yet complete"
        {...selectableStat('reviewsInProgress')}
      >
        {reviewStats?.inProgress ?? 0}
      </AuditorStatCard>
    </div>
  )
}
