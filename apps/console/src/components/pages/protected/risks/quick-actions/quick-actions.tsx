'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { CheckCircle2, UserRoundSearch, SlidersHorizontal, CheckCheck } from 'lucide-react'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config.ts'
import Link from 'next/link'
import type { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import QuickActionsBar, { type QuickActionItem } from '@/components/shared/crud-base/quick-actions/quick-actions-bar'
import CreateReviewSheet from '../../reviews/common/create-review-sheet'
import { RiskRiskDecision, RiskRiskStatus, type UpdateRiskInput } from '@repo/codegen/src/schema'
import { useFormContext } from 'react-hook-form'
import { type EditRisksFormData } from '../view/hooks/use-form-schema'
import { RiskDecisionDialog } from './decision-dialog'

const EDIT_RESTRICTED_IDS = new Set(['mark-as-remediated', 'add-review', 'set-risk-decision', 'add-action-plan'])

type RiskQuickActionsProps = {
  riskId: string
  canEdit: boolean
  handleUpdate: (input: UpdateRiskInput) => Promise<void>
}

const RiskQuickActions: React.FC<RiskQuickActionsProps> = (props) => {
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false)
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false)

  const { setValue } = useFormContext<EditRisksFormData>()

  const taskInitialData = useMemo<TObjectAssociationMap>(() => {
    return { riskIDs: props.riskId ? [props.riskId] : [] }
  }, [props.riskId])

  const actions = useMemo<QuickActionItem[]>(() => {
    const baseActions: QuickActionItem[] = [
      // TOOD: Implement action plan creation flow before enabling this action
      // {
      //   id: 'add-action-plan',
      //   label: 'Create Action Plan',
      //   icon: <ListCheck size={16} />,
      //   // onClick: () => showActionPlanCreateSheet(true),
      // },
      {
        id: 'add-review',
        label: 'Start Review',
        icon: <UserRoundSearch size={16} />,
        onClick: () => setIsCreateReviewOpen(true),
      },
      {
        id: 'set-risk-decision',
        label: 'Set Risk Decision',
        icon: <SlidersHorizontal size={16} />,
        onClick: () => setIsDecisionDialogOpen(true),
      },
      {
        id: 'mark-as-remediated',
        label: 'Mark as Remediated',
        icon: <CheckCheck size={16} />,
        onClick: () => {
          setValue('status', RiskRiskStatus.CLOSED)
          setValue('riskDecision', RiskRiskDecision.MITIGATE)
          props.handleUpdate({ status: RiskRiskStatus.MITIGATED, riskDecision: RiskRiskDecision.MITIGATE })
        },
      },
      {
        id: 'create-task',
        label: 'Create Task',
        icon: <CheckCircle2 size={16} />,
      },
    ]

    return [...baseActions]
  }, [setIsCreateReviewOpen, setIsDecisionDialogOpen, setValue, props])

  const filteredActions = useMemo(() => {
    if (props.canEdit) return actions
    return actions.filter((action) => !EDIT_RESTRICTED_IDS.has(action.id))
  }, [actions, props.canEdit])

  const renderActionButton = (action: QuickActionItem, { inMenu }: { inMenu: boolean }) => {
    if (action.id === 'create-task' && !inMenu) {
      return (
        <CreateTaskDialog
          key={action.id}
          trigger={
            <Button type="button" variant="secondary" className="h-8 px-3" icon={action.icon} iconPosition="left">
              {action.label}
            </Button>
          }
          defaultSelectedObject={ObjectTypeObjects.RISK}
          initialData={taskInitialData}
          hideObjectAssociation
        />
      )
    }

    if (action.href) {
      if (inMenu) {
        return (
          <Link key={action.id} href={action.href}>
            <button type="button" className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer w-full">
              {action.icon}
              <span>{action.label}</span>
            </button>
          </Link>
        )
      }
      return (
        <Link key={action.id} href={action.href}>
          <Button type="button" variant="secondary" className="h-8 px-3" icon={action.icon} iconPosition="left">
            {action.label}
          </Button>
        </Link>
      )
    }

    if (inMenu) {
      return (
        <button key={action.id} onClick={action.onClick} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer w-full">
          {action.icon}
          <span>{action.label}</span>
        </button>
      )
    }

    return (
      <Button key={action.id} type="button" variant="secondary" className="h-8 px-3" icon={action.icon} iconPosition="left" onClick={action.onClick}>
        {action.label}
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <QuickActionsBar actions={filteredActions} renderAction={renderActionButton} />
      {isCreateReviewOpen && <CreateReviewSheet riskId={props.riskId} onClose={() => setIsCreateReviewOpen(false)} />}
      {isDecisionDialogOpen && (
        <RiskDecisionDialog
          key="risk-decision-dialog"
          open={isDecisionDialogOpen}
          onOpenChange={setIsDecisionDialogOpen}
          handleUpdate={async (input) => {
            if (!input.riskDecision) return
            setValue('riskDecision', input.riskDecision)
            props.handleUpdate({ riskDecision: input.riskDecision })
          }}
          internalEditing={null}
          setInternalEditing={() => {}}
        />
      )}
    </div>
  )
}

export default RiskQuickActions
