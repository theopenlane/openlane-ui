'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { PencilIcon, Sparkles } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import { InlineSlideBarToggle } from '@/components/shared/slide-bar/slide-bar'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { MenuActionItem, orderMenuActions, type TMenuAction } from '@/components/shared/menu/menu-action-item'
import { type TElementAnchor } from '@/components/shared/element-anchor/element-anchor'

type TDetailHeaderActionsProps = {
  isEditing?: boolean
  onCancel?: React.MouseEventHandler<HTMLButtonElement>
  isSaving?: boolean
  onEdit?: React.MouseEventHandler<HTMLButtonElement>
  editLabel?: string
  editDisabledReason?: string
  onAskAI?: () => void
  actions?: React.ReactNode
  menuActions?: (TMenuAction | false | undefined)[]
  menuAnchor?: TElementAnchor
}

const isMenuAction = (action: TMenuAction | false | undefined): action is TMenuAction => !!action

const DetailHeaderActions: React.FC<TDetailHeaderActionsProps> = ({ isEditing = false, onCancel, isSaving, onEdit, editLabel, editDisabledReason, onAskAI, actions, menuActions = [], menuAnchor }) => {
  const items = orderMenuActions(menuActions.filter(isMenuAction))

  const askAIButton = onAskAI && (
    <Button type="button" variant="secondary" onClick={onAskAI} icon={<Sparkles size={16} />} iconPosition="left">
      Ask AI
    </Button>
  )

  if (isEditing) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {askAIButton}
        <SlideoutFormActions submitsEnclosingForm onCancel={onCancel} isPending={isSaving} />
        <InlineSlideBarToggle />
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {askAIButton}
      {onEdit && (
        <DisabledReasonTooltip reason={editDisabledReason}>
          <Button type="button" variant="secondary" onClick={onEdit} disabled={!!editDisabledReason} aria-label={editLabel} icon={<PencilIcon size={16} strokeWidth={2} />} iconPosition="left">
            Edit
          </Button>
        </DisabledReasonTooltip>
      )}
      {actions}
      {items.length > 0 && (
        <Menu
          triggerAnchor={menuAnchor}
          content={items.map((action) => (
            <MenuActionItem key={action.key} action={action} />
          ))}
        />
      )}
      <InlineSlideBarToggle />
    </div>
  )
}

export default DetailHeaderActions
