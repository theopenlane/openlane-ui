'use client'

import React from 'react'
import { SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { DropdownMenuItem } from '@repo/ui/dropdown-menu'
import { cn } from '@repo/ui/lib/utils'
import { ArrowLeft, ArrowRightLeft, Ellipsis, LinkIcon, Pencil, Trash2, X } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'

export type SlideoutMenuAction = {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

export type SlideoutPrimaryAction = {
  label: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export type SlideoutHeaderProps = {
  title: React.ReactNode
  titleAs?: React.ElementType
  titleAdornment?: React.ReactNode
  aboveTitle?: React.ReactNode
  onClose?: () => void
  onBack?: () => void
  backDisabled?: boolean
  onEdit?: () => void
  primaryAction?: SlideoutPrimaryAction
  menuActions?: SlideoutMenuAction[]
}

export const copyLinkMenuAction = (onClick: () => void): SlideoutMenuAction => ({
  key: 'copy-link',
  label: 'Copy link',
  icon: <LinkIcon size={16} strokeWidth={2} />,
  onClick,
})

export const mergeMenuAction = (onClick: () => void): SlideoutMenuAction => ({
  key: 'merge',
  label: 'Merge with…',
  icon: <ArrowRightLeft size={16} strokeWidth={2} />,
  onClick,
})

export const deleteMenuAction = (onClick: () => void, options?: { disabled?: boolean }): SlideoutMenuAction => ({
  key: 'delete',
  label: 'Delete',
  icon: <Trash2 size={16} strokeWidth={2} />,
  destructive: true,
  disabled: options?.disabled,
  onClick,
})

const orderMenuActions = (actions: SlideoutMenuAction[]) => [...actions.filter((a) => !a.destructive), ...actions.filter((a) => a.destructive)]

export const SlideoutHeader = ({ title, titleAs, titleAdornment, aboveTitle, onClose, onBack, backDisabled, onEdit, primaryAction, menuActions = [] }: SlideoutHeaderProps) => {
  const TitleTag = titleAs ?? SheetTitle
  const editBelongsInMenu = !!onEdit && !!primaryAction

  const resolvedMenuActions = orderMenuActions(editBelongsInMenu ? [{ key: 'edit', label: 'Edit', icon: <Pencil size={16} strokeWidth={2} />, onClick: onEdit }, ...menuActions] : menuActions)

  return (
    <div className="flex flex-col gap-3">
      {aboveTitle}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && <Button variant="secondary" size="icon-sm" icon={<ArrowLeft size={16} />} descriptiveTooltipText="Back" onClick={onBack} disabled={backDisabled} />}
          <TitleTag className="min-w-0 truncate text-lg font-normal">{title}</TitleTag>
          {titleAdornment}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {primaryAction && (
            <Button
              variant={primaryAction.variant ?? 'primary'}
              type="button"
              icon={primaryAction.icon}
              iconPosition={primaryAction.icon ? 'left' : undefined}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              loading={primaryAction.loading}
            >
              {primaryAction.label}
            </Button>
          )}
          {!editBelongsInMenu && onEdit && <Button variant="secondary" size="icon-sm" icon={<Pencil size={16} />} descriptiveTooltipText="Edit" onClick={onEdit} />}
          {resolvedMenuActions.length > 0 && (
            <Menu
              trigger={<Button variant="secondary" size="icon-sm" icon={<Ellipsis size={16} />} descriptiveTooltipText="More actions" />}
              content={resolvedMenuActions.map(({ key, label, icon, onClick, disabled, destructive }) => (
                <DropdownMenuItem key={key} onSelect={onClick} disabled={disabled} className={cn('flex items-center gap-2 px-1', destructive && 'text-destructive')}>
                  {icon}
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}
            />
          )}
          {onClose && <Button variant="secondary" size="icon-sm" icon={<X size={16} />} descriptiveTooltipText="Close" onClick={onClose} />}
        </div>
      </div>
    </div>
  )
}
