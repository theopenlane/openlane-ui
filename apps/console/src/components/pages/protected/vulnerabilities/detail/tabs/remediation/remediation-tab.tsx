'use client'

import React, { useMemo, useState } from 'react'
import { Link2, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { invalidateVulnerabilityQueries, useVulnerabilityRemediationWork } from '@/lib/graphql-hooks/vulnerability'
import { useQueryClient } from '@tanstack/react-query'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { ResponsibilityCell } from '@/components/shared/crud-base/columns/responsibility-cell'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import CreateRemediationSheet from '@/components/pages/protected/remediations/create-remediation-sheet'
import { SetVulnerabilityAssociationDialog } from '../../../set-vulnerability-association-dialog'
import { buildRemediationTaskDefaults, getVulnerabilityTitle, type TVulnerabilityDetail } from '../../../vulnerability-display'

const EMPTY_USER_MAP = {}
const REMEDIATION_SKELETON_SECTIONS = ['remediations', 'tasks', 'action-plans']

type TRemediationTabProps = {
  vulnerability: TVulnerabilityDetail
  canEdit: boolean
  canCreateRemediation: boolean
}

type TWorkSectionProps = {
  title: string
  action?: React.ReactNode
  columns: string[]
  totalCount: number
  shownCount: number
  emptyText: string
  children: React.ReactNode
}

const WorkSection: React.FC<TWorkSectionProps> = ({ title, action, columns, totalCount, shownCount, emptyText, children }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
    {shownCount === 0 ? (
      <EmptyTabState title={`No ${title.toLowerCase()} yet`} description={emptyText} />
    ) : (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </div>
    )}
    {totalCount > shownCount && (
      <p className="text-xs text-muted-foreground">
        Showing the {shownCount} most recent of {totalCount}. The full list is in the Associated Objects panel.
      </p>
    )}
  </section>
)

const RemediationTab: React.FC<TRemediationTabProps> = ({ vulnerability, canEdit, canCreateRemediation }) => {
  const [isCreateRemediationOpen, setIsCreateRemediationOpen] = useState(false)
  const { data: session } = useSession()
  const openObjectSheet = useOpenObjectSheet()
  const queryClient = useQueryClient()
  const { data, isPending, isError, error } = useVulnerabilityRemediationWork(vulnerability.id)
  useQueryErrorNotification({ error, description: 'Failed to load remediation work' })

  const title = getVulnerabilityTitle(vulnerability)
  const work = data?.vulnerability
  const remediations = getNodes({ edges: work?.remediations.edges })
  const tasks = getNodes({ edges: work?.tasks.edges })
  const actionPlans = getNodes({ edges: work?.actionPlans.edges })

  const taskInitialValues = useMemo(() => buildRemediationTaskDefaults(title, session?.user?.userId), [title, session?.user?.userId])
  const taskInitialData = useMemo(() => ({ vulnerabilityIDs: [vulnerability.id] }), [vulnerability.id])

  if (isPending)
    return (
      <div className="space-y-8" role="status" aria-live="polite" aria-label="Loading remediation work">
        {REMEDIATION_SKELETON_SECTIONS.map((section) => (
          <div key={section} className="space-y-3">
            <Skeleton height={18} className="w-full max-w-[160px] rounded-md" />
            <div className="space-y-2">
              <SkeletonRows count={2} height={40} />
            </div>
          </div>
        ))}
      </div>
    )
  if (isError) return <EmptyTabState title="Remediation work unavailable" description="Remediations, tasks and action plans for this vulnerability could not be loaded." />

  return (
    <div className="space-y-8">
      <WorkSection
        title="Remediations"
        columns={['Title', 'Status', 'Owner', 'Due']}
        totalCount={work?.remediations.totalCount ?? 0}
        shownCount={remediations.length}
        emptyText="No remediations are tracking this vulnerability."
        action={
          canCreateRemediation && (
            <Button type="button" variant="secondary" icon={<Plus size={16} />} iconPosition="left" onClick={() => setIsCreateRemediationOpen(true)}>
              Remediation
            </Button>
          )
        }
      >
        {remediations.map((remediation) => (
          <TableRow key={remediation.id}>
            <TableCell>
              <ObjectSheetLink id={remediation.id} kind={ObjectAssociationNodeEnum.REMEDIATION} label={remediation.title || remediation.displayID} onOpenSheet={openObjectSheet} />
            </TableCell>
            <TableCell>{remediation.status ? getEnumLabel(remediation.status) : '—'}</TableCell>
            <TableCell>{remediation.ownerReference || '—'}</TableCell>
            <TableCell>
              <DateCell value={remediation.dueAt} />
            </TableCell>
          </TableRow>
        ))}
      </WorkSection>

      <WorkSection
        title="Tasks"
        columns={['Title', 'Status', 'Assignee', 'Due']}
        totalCount={work?.tasks.totalCount ?? 0}
        shownCount={tasks.length}
        emptyText="No tasks are linked to this vulnerability."
        action={
          <CreateTaskDialog
            trigger={
              <Button type="button" variant="secondary" icon={<Plus size={16} />} iconPosition="left">
                Task
              </Button>
            }
            initialValues={taskInitialValues}
            initialData={taskInitialData}
            defaultSelectedObject={ObjectTypeObjects.VULNERABILITY}
            hideObjectAssociation
            onSuccessWithId={() => invalidateVulnerabilityQueries(queryClient)}
          />
        }
      >
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <ObjectSheetLink id={task.id} kind={ObjectAssociationNodeEnum.TASK} label={task.title} onOpenSheet={openObjectSheet} />
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5">
                {TaskStatusIconMapper[task.status]}
                {getEnumLabel(task.status)}
              </span>
            </TableCell>
            <TableCell>{task.assignee?.displayName ?? <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
            <TableCell>
              <DateCell value={task.due} />
            </TableCell>
          </TableRow>
        ))}
      </WorkSection>

      <WorkSection
        title="Action Plans"
        columns={['Title', 'Status', 'Owner', 'Due']}
        totalCount={work?.actionPlans.totalCount ?? 0}
        shownCount={actionPlans.length}
        emptyText="No action plans are linked to this vulnerability."
        action={
          canEdit && (
            <SetVulnerabilityAssociationDialog
              vulnerabilityId={vulnerability.id}
              defaultSelectedObject={ObjectTypeObjects.ACTION_PLAN}
              allowedObjectTypes={[ObjectTypeObjects.ACTION_PLAN]}
              trigger={
                <Button type="button" variant="secondary" icon={<Link2 size={16} />} iconPosition="left">
                  Link Action Plan
                </Button>
              }
            />
          )
        }
      >
        {actionPlans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>{plan.title || plan.name}</TableCell>
            <TableCell>{plan.status ? getEnumLabel(plan.status) : '—'}</TableCell>
            <TableCell>
              <ResponsibilityCell
                userMap={EMPTY_USER_MAP}
                user={plan.internalOwnerUser}
                group={plan.internalOwnerGroup}
                personnel={plan.internalOwnerIdentityHolder}
                stringValue={plan.internalOwner}
              />
            </TableCell>
            <TableCell>
              <DateCell value={plan.dueDate} />
            </TableCell>
          </TableRow>
        ))}
      </WorkSection>

      <CreateRemediationSheet
        isOpen={isCreateRemediationOpen}
        onClose={() => setIsCreateRemediationOpen(false)}
        initialData={{ vulnerabilityIDs: [vulnerability.id] }}
        defaultTitle={`${title} Remediation`}
        onSuccess={() => {
          setIsCreateRemediationOpen(false)
          invalidateVulnerabilityQueries(queryClient)
        }}
      />
    </div>
  )
}

export default RemediationTab
