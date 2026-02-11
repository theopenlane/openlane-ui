'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { PlusSquare, Upload, CheckCircle2, Target, GitBranch } from 'lucide-react'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config.ts'
import Link from 'next/link'
import EvidenceCreateSheet from '@/components/pages/protected/evidence/evidence-create-sheet'
import CreateControlImplementationSheet from '@/components/pages/protected/controls/tabs/implementation/control-implementation-components/create-control-implementation-sheet'
import type { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import QuickActionsBar, { type QuickActionItem } from '@/components/pages/protected/controls/quick-actions/quick-actions-bar'
import { useGetControlAssociationsById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolAssociationsById } from '@/lib/graphql-hooks/subcontrol'
import { buildControlEvidenceData, buildEvidenceControlParam, buildSubcontrolEvidenceData } from '@/components/pages/protected/controls/evidence-data'
import CreateControlObjectiveSheet from '../tabs/implementation/control-objectives-components/create-control-objective-sheet'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type ControlLike = {
  id?: string | null
  referenceFramework?: string | null
  refCode?: string | null
  controlObjectives?: {
    edges?: Array<{ node?: { id?: string | null; displayID?: string | null } | null } | null> | null
  } | null
}

type SubcontrolLike = {
  id?: string | null
  referenceFramework?: string | null
  refCode?: string | null
  controlObjectives?: {
    edges?: Array<{ node?: { id?: string | null; displayID?: string | null } | null } | null> | null
  } | null
}

type BaseQuickActionsProps = {
  controlId: string
}

type ControlQuickActionsProps = BaseQuickActionsProps & {
  kind: 'control'
  control: ControlLike
}

type SubcontrolQuickActionsProps = BaseQuickActionsProps & {
  kind: 'subcontrol'
  subcontrolId: string
  subcontrol: SubcontrolLike
}

type QuickActionsProps = ControlQuickActionsProps | SubcontrolQuickActionsProps

const ControlQuickActions: React.FC<QuickActionsProps> = (props) => {
  const [isEvidenceSheetOpen, setIsEvidenceSheetOpen] = useState(false)
  const [showCreateImplementationSheet, setShowCreateImplementationSheet] = useState(false)
  const [showCreateObjectiveSheet, setShowCreateObjectiveSheet] = useState(false)

  const isSubcontrol = props.kind === 'subcontrol'
  const subcontrolId = isSubcontrol ? props.subcontrolId : undefined
  const controlId = props.controlId
  const controlData = props.kind === 'control' ? props.control : undefined
  const subcontrolData = props.kind === 'subcontrol' ? props.subcontrol : undefined
  const { data: controlAssociationsData } = useGetControlAssociationsById(isSubcontrol ? undefined : controlId)
  const { data: subcontrolAssociationsData } = useGetSubcontrolAssociationsById(subcontrolId)

  const evidenceControlParam = useMemo(() => {
    if (isSubcontrol) return undefined
    return buildEvidenceControlParam(controlData)
  }, [controlData, isSubcontrol])

  const evidenceFormData = useMemo(() => {
    if (isSubcontrol) {
      return buildSubcontrolEvidenceData(subcontrolData ?? null, subcontrolAssociationsData)
    }
    return buildControlEvidenceData(controlData ?? null, controlAssociationsData)
  }, [controlAssociationsData, controlData, isSubcontrol, subcontrolAssociationsData, subcontrolData])

  const taskInitialData = useMemo<TObjectAssociationMap>(() => {
    if (isSubcontrol) {
      return { subcontrolIDs: subcontrolId ? [subcontrolId] : [] }
    }

    return { controlIDs: controlId ? [controlId] : [] }
  }, [isSubcontrol, controlId, subcontrolId])

  const actions = useMemo<QuickActionItem[]>(() => {
    const baseActions: QuickActionItem[] = [
      {
        id: 'add-implementation',
        label: 'Add Implementation',
        icon: <PlusSquare size={16} />,
        onClick: () => setShowCreateImplementationSheet(true),
      },
      {
        id: 'add-objective',
        label: 'Add Objective',
        icon: <Target size={16} />,
        onClick: () => setShowCreateObjectiveSheet(true),
      },
      {
        id: 'upload-evidence',
        label: 'Upload Evidence',
        icon: <Upload size={16} />,
        onClick: () => setIsEvidenceSheetOpen(true),
      },
      {
        id: 'create-task',
        label: 'Create Task',
        icon: <CheckCircle2 size={16} />,
      },
    ]

    if (isSubcontrol) {
      return [
        ...baseActions,
        {
          id: 'map-control',
          label: 'Map Control',
          icon: <GitBranch size={16} />,
          href: `/controls/${controlId}/${subcontrolId}/map-control`,
        },
      ]
    }

    return [
      ...baseActions,
      {
        id: 'create-subcontrol',
        label: 'Create Subcontrol',
        icon: <PlusSquare size={16} />,
        href: `/controls/${controlId}/create-subcontrol`,
      },
      {
        id: 'map-control',
        label: 'Map Control',
        icon: <GitBranch size={16} />,
        href: `/controls/${controlId}/map-control`,
      },
    ]
  }, [isSubcontrol, controlId, subcontrolId])

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
          defaultSelectedObject={isSubcontrol ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL}
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

  const controlParam = useMemo(() => {
    if (isSubcontrol) {
      const referenceFramework = Object.values(evidenceFormData.subcontrolReferenceFramework ?? {})[0] ?? ''
      const refCode = evidenceFormData.subcontrolRefCodes?.[0] ?? ''
      return {
        id: evidenceFormData.subcontrolID ?? subcontrolId ?? '',
        referenceFramework,
        refCode,
        __typename: ObjectTypes.SUBCONTROL,
      }
    }

    const referenceFramework = evidenceControlParam?.referenceFramework ?? evidenceFormData.referenceFramework ?? {}
    const controlRefCodes = evidenceControlParam?.controlRefCodes ?? evidenceFormData.controlRefCodes ?? []
    return {
      id: evidenceControlParam?.id ?? evidenceFormData.controlID ?? controlId,
      referenceFramework: Object.values(referenceFramework)[0] ?? '',
      refCode: controlRefCodes[0] ?? '',
      __typename: ObjectTypes.CONTROL,
    }
  }, [evidenceFormData, isSubcontrol, controlId, subcontrolId, evidenceControlParam])

  return (
    <div className="space-y-3">
      <QuickActionsBar actions={actions} renderAction={renderActionButton} />
      <EvidenceCreateSheet
        open={isEvidenceSheetOpen}
        onEvidenceCreateSuccess={() => setIsEvidenceSheetOpen(false)}
        onOpenChange={setIsEvidenceSheetOpen}
        formData={evidenceFormData}
        controlParam={[controlParam]}
        excludeObjectTypes={[
          ObjectTypeObjects.EVIDENCE,
          ObjectTypeObjects.RISK,
          ObjectTypeObjects.PROCEDURE,
          ObjectTypeObjects.GROUP,
          ObjectTypeObjects.INTERNAL_POLICY,
          ObjectTypeObjects.CONTROL,
          ObjectTypeObjects.SUB_CONTROL,
          ObjectTypeObjects.PROGRAM,
        ]}
        defaultSelectedObject={ObjectTypeObjects.TASK}
      />
      <CreateControlImplementationSheet open={showCreateImplementationSheet} onOpenChange={setShowCreateImplementationSheet} />
      <CreateControlObjectiveSheet open={showCreateObjectiveSheet} onOpenChange={setShowCreateObjectiveSheet} />
    </div>
  )
}

export default ControlQuickActions
