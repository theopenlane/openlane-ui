'use client'

import React, { useState } from 'react'
import { CheckCircle2, Link2, Wrench } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import CreateRemediationSheet from '@/components/pages/protected/remediations/create-remediation-sheet'
import QuickActionsBar, { type QuickActionItem } from '@/components/shared/crud-base/quick-actions/quick-actions-bar'
import MenuItem from '@/components/shared/menu/menu-item'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { type Connection } from '@/lib/graphql-hooks/connection'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type TExposureLinkedTo, type TLinkActionPlanDialogProps } from './remediation/remediation-links'

type TDetailQuickActionsProps = {
  title: string
  remediations: Connection<{ id: string }> | null | undefined
  canCreateRemediation: boolean
  taskInitialValues: React.ComponentProps<typeof CreateTaskDialog>['initialValues']
  linkedTo: TExposureLinkedTo
  remediationInstructions?: string
  defaultSelectedObject: ObjectTypeObjects
  onShowRemediationTab: () => void
  renderLinkActionPlan?: (props: TLinkActionPlanDialogProps) => React.ReactNode
  onTaskCreated?: () => void
  onRemediationCreated?: () => void
  extraActions?: QuickActionItem[]
  children?: React.ReactNode
}

const DetailQuickActions: React.FC<TDetailQuickActionsProps> = ({
  title,
  remediations,
  canCreateRemediation,
  taskInitialValues,
  linkedTo,
  remediationInstructions,
  defaultSelectedObject,
  onShowRemediationTab,
  renderLinkActionPlan,
  onTaskCreated,
  onRemediationCreated,
  extraActions = [],
  children,
}) => {
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const [isRemediationOpen, setIsRemediationOpen] = useState(false)
  const [isLinkActionPlanOpen, setIsLinkActionPlanOpen] = useState(false)
  const openObjectSheet = useOpenObjectSheet()

  const remediationCount = remediations?.totalCount ?? 0
  const firstRemediationId = getNodes(remediations)[0]?.id

  const handleRemediation = () => {
    if (remediationCount > 1) {
      onShowRemediationTab()
      return
    }
    if (firstRemediationId) {
      openObjectSheet(firstRemediationId, ObjectAssociationNodeEnum.REMEDIATION)
      return
    }
    setIsRemediationOpen(true)
  }

  const actions: QuickActionItem[] = [
    { id: 'create-task', label: 'Task', icon: <CheckCircle2 size={16} />, onClick: () => setIsTaskOpen(true) },
    ...(remediationCount > 0 || canCreateRemediation
      ? [{ id: 'remediation', label: remediationCount > 0 ? 'Open Remediation' : 'Remediation', icon: <Wrench size={16} />, onClick: handleRemediation }]
      : []),
    ...(renderLinkActionPlan ? [{ id: 'link-action-plan', label: 'Link Action Plan', icon: <Link2 size={16} />, onClick: () => setIsLinkActionPlanOpen(true) }] : []),
    ...extraActions,
  ]

  const renderAction = (action: QuickActionItem, { inMenu }: { inMenu: boolean }) =>
    inMenu ? (
      <MenuItem key={action.id} icon={action.icon} onSelect={action.onClick}>
        {action.label}
      </MenuItem>
    ) : (
      <Button key={action.id} type="button" variant="secondary" className="h-8 shrink-0 whitespace-nowrap px-3" icon={action.icon} iconPosition="left" onClick={action.onClick}>
        {action.label}
      </Button>
    )

  return (
    <>
      <QuickActionsBar actions={actions} renderAction={renderAction} />
      <CreateTaskDialog
        open={isTaskOpen}
        onOpenChange={setIsTaskOpen}
        initialValues={taskInitialValues}
        initialData={linkedTo}
        defaultSelectedObject={defaultSelectedObject}
        hideObjectAssociation
        onSuccessWithId={onTaskCreated}
      />
      <CreateRemediationSheet
        isOpen={isRemediationOpen}
        onClose={() => setIsRemediationOpen(false)}
        initialData={linkedTo}
        defaultTitle={`${title} Remediation`}
        defaultInstructions={remediationInstructions}
        onSuccess={() => {
          setIsRemediationOpen(false)
          onRemediationCreated?.()
        }}
      />
      {renderLinkActionPlan?.({ open: isLinkActionPlanOpen, onOpenChange: setIsLinkActionPlanOpen })}
      {children}
    </>
  )
}

export default DetailQuickActions
