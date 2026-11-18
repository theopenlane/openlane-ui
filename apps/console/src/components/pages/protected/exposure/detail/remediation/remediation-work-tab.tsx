'use client'

import React, { useState } from 'react'
import { Link2, Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { type ActionPlan, type Group, type IdentityHolder, type Remediation, type Task, type User } from '@repo/codegen/src/schema'
import { type Connection, getNodes } from '@/lib/graphql-hooks/connection'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
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
import { type TLinkActionPlanDialogProps } from './remediation-links'
import { type TExposureRemediationContext } from './use-exposure-remediation-context'

const EMPTY_USER_MAP = {}
const REMEDIATION_SKELETON_SECTIONS = ['remediations', 'tasks', 'action-plans']

type TRemediationWork = {
  remediations: Connection<Pick<Remediation, 'id' | 'displayID' | 'title' | 'status' | 'ownerReference' | 'dueAt'>>
  tasks: Connection<Pick<Task, 'id' | 'displayID' | 'title' | 'status' | 'due'> & { assignee?: Pick<User, 'id' | 'displayName'> | null }>
  actionPlans: Connection<
    Pick<ActionPlan, 'id' | 'name' | 'title' | 'status' | 'dueDate' | 'internalOwner'> & {
      internalOwnerUser?: Pick<User, 'id' | 'displayName'> | null
      internalOwnerGroup?: Pick<Group, 'id' | 'displayName'> | null
      internalOwnerIdentityHolder?: Pick<IdentityHolder, 'id' | 'fullName' | 'email'> | null
    }
  >
}

type TRemediationWorkTabProps = {
  entityName: string
  workQuery: {
    data: TRemediationWork | undefined
    isPending: boolean
    isError: boolean
    error: unknown
  }
  canCreateRemediation: boolean
  context: TExposureRemediationContext
  renderLinkActionPlan?: (props: TLinkActionPlanDialogProps) => React.ReactNode
}

type TWorkSectionProps = {
  title: string
  action?: React.ReactNode
  columns: string[]
  totalCount: number
  shownCount: number
  children: React.ReactNode
}

const WorkSection: React.FC<TWorkSectionProps> = ({ title, action, columns, totalCount, shownCount, children }) =>
  shownCount === 0 ? null : (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
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
      {totalCount > shownCount && (
        <p className="text-xs text-muted-foreground">
          Showing the {shownCount} most recent of {totalCount}. The full list is in the Associated Objects panel.
        </p>
      )}
    </section>
  )

const RemediationWorkTab: React.FC<TRemediationWorkTabProps> = ({ entityName, workQuery, canCreateRemediation, context, renderLinkActionPlan }) => {
  const [isCreateRemediationOpen, setIsCreateRemediationOpen] = useState(false)
  const openObjectSheet = useOpenObjectSheet()
  const { data: work, isPending, isError, error } = workQuery
  useQueryErrorNotification({ error, description: 'Failed to load remediation work' })

  const remediations = getNodes(work?.remediations)
  const tasks = getNodes(work?.tasks)
  const actionPlans = getNodes(work?.actionPlans)

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
  if (isError) return <EmptyTabState title="Remediation work unavailable" description={`Remediations, tasks and action plans for this ${entityName} could not be loaded.`} />

  if (remediations.length === 0 && tasks.length === 0 && actionPlans.length === 0)
    return <EmptyTabState title="No remediation work" description="Use the quick actions above to add a task or remediation, or to link an action plan." />

  return (
    <div className="space-y-8">
      <WorkSection
        title="Remediations"
        columns={['Title', 'Status', 'Owner', 'Due']}
        totalCount={work?.remediations.totalCount ?? 0}
        shownCount={remediations.length}
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
        action={
          <CreateTaskDialog
            trigger={
              <Button type="button" variant="secondary" icon={<Plus size={16} />} iconPosition="left">
                Task
              </Button>
            }
            initialValues={context.taskInitialValues}
            initialData={context.linkedTo}
            defaultSelectedObject={context.defaultSelectedObject}
            hideObjectAssociation
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
        action={renderLinkActionPlan?.({
          trigger: (
            <Button type="button" variant="secondary" icon={<Link2 size={16} />} iconPosition="left">
              Link Action Plan
            </Button>
          ),
        })}
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
        context={context.remediationContext}
        initialInstructions={context.initialInstructions}
        onSuccess={() => setIsCreateRemediationOpen(false)}
      />
    </div>
  )
}

export default RemediationWorkTab
