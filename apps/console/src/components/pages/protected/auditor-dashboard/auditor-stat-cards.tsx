'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { CalendarDays, ClipboardCheck, Building2, UserRoundCheck, ListChecks, FileCheck2, CircleCheckBig, Loader, Copy } from 'lucide-react'
import { formatDate } from '@/utils/date'
import { useNotification } from '@/hooks/useNotification'
import { type GetProgramBasicInfoQuery } from '@repo/codegen/src/schema'

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
}

const AuditorStatCard: React.FC<AuditorStatCardProps> = ({ icon, label, children }) => (
  <Card className="p-4 flex flex-col gap-2 w-full">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-base font-medium">{children}</div>
  </Card>
)

type AuditorStatCardsProps = {
  program?: GetProgramBasicInfoQuery['program'] | null
  evidenceStats?: { total: number; submitted: number }
  reviewStats?: { completed: number; inProgress: number }
}

const ICON_SIZE = 16

export const AuditorStatCards: React.FC<AuditorStatCardsProps> = ({ program, evidenceStats, reviewStats }) => {
  const auditPeriod = program?.startDate || program?.endDate ? `${formatDate(program?.startDate, 'TBD')} – ${formatDate(program?.endDate, 'TBD')}` : '—'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AuditorStatCard icon={<CalendarDays size={ICON_SIZE} />} label="Audit Period">
        {auditPeriod}
      </AuditorStatCard>

      <AuditorStatCard icon={<ClipboardCheck size={ICON_SIZE} />} label="Fieldwork">
        <span className="text-muted-foreground font-normal">Not tracked yet</span>
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

      <AuditorStatCard icon={<ListChecks size={ICON_SIZE} />} label="Controls in Scope">
        {evidenceStats?.total ?? 0}
      </AuditorStatCard>

      <AuditorStatCard icon={<FileCheck2 size={ICON_SIZE} />} label="Evidence Ready">
        {evidenceStats?.submitted ?? 0}/{evidenceStats?.total ?? 0}
      </AuditorStatCard>

      <AuditorStatCard icon={<CircleCheckBig size={ICON_SIZE} />} label="Reviews Completed">
        {reviewStats?.completed ?? 0}
      </AuditorStatCard>

      <AuditorStatCard icon={<Loader size={ICON_SIZE} />} label="In Progress">
        {reviewStats?.inProgress ? (
          <Badge variant="gold" className="text-xs font-medium">
            {reviewStats.inProgress} in progress
          </Badge>
        ) : (
          0
        )}
      </AuditorStatCard>
    </div>
  )
}
