'use client'

import React, { useMemo, useState } from 'react'
import { CircleCheck, CircleX, ClipboardCheck, Link2, Upload } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import QuickActionsBar, { type QuickActionItem } from '@/components/shared/crud-base/quick-actions/quick-actions-bar'
import MenuItem from '@/components/shared/menu/menu-item'
import { LINKABLE_CONTROL_TYPES } from '@/components/shared/object-association/association-configs'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type ControlImplementationDetailNode } from '@/lib/graphql-hooks/control-implementation'
import EvidenceCreateSheet from '@/components/pages/protected/evidence/evidence-create-sheet'
import { type CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { SetControlImplementationAssociationDialog } from '../set-control-implementation-association-dialog'

const EVIDENCE_OBJECT_TYPES = [ObjectTypeObjects.CONTROL_IMPLEMENTATION, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.SCAN, ObjectTypeObjects.TASK]

type TOpenDialog = 'link-controls' | 'create-task' | 'create-evidence' | null

type TControlImplementationQuickActionsProps = {
  implementation: ControlImplementationDetailNode
  title: string
  canEdit: boolean
  isSaving: boolean
  onVerifiedChange: (verified: boolean) => void
}

const ControlImplementationQuickActions: React.FC<TControlImplementationQuickActionsProps> = ({ implementation, title, canEdit, isSaving, onVerifiedChange }) => {
  const [openDialog, setOpenDialog] = useState<TOpenDialog>(null)
  const { id, verified, controls, subcontrols } = implementation

  const evidenceControls = useMemo<CustomEvidenceControl[]>(
    () => [
      ...getNodes(controls).map((node) => ({ id: node.id, refCode: node.refCode, referenceFramework: node.referenceFramework, __typename: ObjectTypes.CONTROL })),
      ...getNodes(subcontrols).map((node) => ({ id: node.id, refCode: node.refCode, referenceFramework: node.referenceFramework, __typename: ObjectTypes.SUBCONTROL })),
    ],
    [controls, subcontrols],
  )

  const evidenceFormData = useMemo<TFormEvidenceData>(
    () => ({
      displayID: title,
      objectAssociations: {
        controlIDs: getNodes(controls).map((node) => node.id),
        subcontrolIDs: getNodes(subcontrols).map((node) => node.id),
        controlImplementationIDs: [id],
      },
    }),
    [title, controls, subcontrols, id],
  )

  const taskInitialData = useMemo(() => ({ controlImplementationIDs: [id] }), [id])

  const actions = useMemo<QuickActionItem[]>(
    () => [
      ...(canEdit
        ? [
            {
              id: 'mark-verified',
              label: verified ? 'Mark Not Verified' : 'Mark Verified',
              icon: verified ? <CircleX size={16} /> : <CircleCheck size={16} />,
              onClick: () => onVerifiedChange(!verified),
            },
            { id: 'link-controls', label: 'Link Controls', icon: <Link2 size={16} />, onClick: () => setOpenDialog('link-controls') },
          ]
        : []),
      { id: 'create-task', label: 'Create Task', icon: <ClipboardCheck size={16} />, onClick: () => setOpenDialog('create-task') },
      { id: 'create-evidence', label: 'Create Evidence', icon: <Upload size={16} />, onClick: () => setOpenDialog('create-evidence') },
    ],
    [canEdit, verified, onVerifiedChange],
  )

  const renderAction = (action: QuickActionItem, { inMenu }: { inMenu: boolean }) =>
    inMenu ? (
      <MenuItem key={action.id} icon={action.icon} onSelect={action.onClick}>
        {action.label}
      </MenuItem>
    ) : (
      <Button
        key={action.id}
        type="button"
        variant="secondary"
        className="h-8 shrink-0 whitespace-nowrap px-3"
        icon={action.icon}
        iconPosition="left"
        onClick={action.onClick}
        disabled={action.id === 'mark-verified' && isSaving}
      >
        {action.label}
      </Button>
    )

  const handleOpenChange = (open: boolean) => {
    if (!open) setOpenDialog(null)
  }

  return (
    <>
      <QuickActionsBar actions={actions} renderAction={renderAction} />
      <SetControlImplementationAssociationDialog
        controlImplementationId={id}
        open={openDialog === 'link-controls'}
        onOpenChange={handleOpenChange}
        defaultSelectedObject={ObjectTypeObjects.CONTROL}
        allowedObjectTypes={LINKABLE_CONTROL_TYPES}
      />
      <CreateTaskDialog
        open={openDialog === 'create-task'}
        onOpenChange={handleOpenChange}
        defaultSelectedObject={ObjectTypeObjects.CONTROL_IMPLEMENTATION}
        initialData={taskInitialData}
        hideObjectAssociation
      />
      <EvidenceCreateSheet
        open={openDialog === 'create-evidence'}
        onOpenChange={handleOpenChange}
        formData={evidenceFormData}
        controlParam={evidenceControls}
        allowedObjectTypes={EVIDENCE_OBJECT_TYPES}
        defaultSelectedObject={ObjectTypeObjects.TASK}
      />
    </>
  )
}

export default ControlImplementationQuickActions
