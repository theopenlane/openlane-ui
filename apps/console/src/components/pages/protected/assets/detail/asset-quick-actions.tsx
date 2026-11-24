'use client'

import React from 'react'
import { ClipboardCheck, Link2, Shield, Upload } from 'lucide-react'
import { Button } from '@repo/ui/button'
import QuickActionsBar, { type QuickActionItem } from '@/components/shared/crud-base/quick-actions/quick-actions-bar'
import MenuItem from '@/components/shared/menu/menu-item'

export type TAssetDialog = 'upload-evidence' | 'map-control' | 'link-exposure' | 'mark-reviewed' | 'add-review'

type TAssetQuickActionsProps = {
  canUploadEvidence: boolean
  canMapControl: boolean
  canLinkExposure: boolean
  canReview: boolean
  onOpenDialog: (dialog: TAssetDialog) => void
}

const AssetQuickActions: React.FC<TAssetQuickActionsProps> = ({ canUploadEvidence, canMapControl, canLinkExposure, canReview, onOpenDialog }) => {
  const actions: QuickActionItem[] = [
    ...(canUploadEvidence ? [{ id: 'upload-evidence', label: 'Upload Evidence', icon: <Upload size={16} />, onClick: () => onOpenDialog('upload-evidence') }] : []),
    ...(canMapControl ? [{ id: 'map-control', label: 'Map Control', icon: <Shield size={16} />, onClick: () => onOpenDialog('map-control') }] : []),
    ...(canLinkExposure ? [{ id: 'link-exposure', label: 'Link Exposure', icon: <Link2 size={16} />, onClick: () => onOpenDialog('link-exposure') }] : []),
    ...(canReview ? [{ id: 'mark-reviewed', label: 'Mark Reviewed', icon: <ClipboardCheck size={16} />, onClick: () => onOpenDialog('mark-reviewed') }] : []),
  ]

  if (actions.length === 0) return null

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

  return <QuickActionsBar actions={actions} renderAction={renderAction} />
}

export default AssetQuickActions
