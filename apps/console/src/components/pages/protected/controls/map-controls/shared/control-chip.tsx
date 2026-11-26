import React from 'react'
import { Badge } from '@repo/ui/badge'
import Drag from '@/assets/Drag'
import { Plus, XIcon } from 'lucide-react'
import NextLink from 'next/link'
import { ControlHoverCard } from '@/components/shared/control-tooltip/control-tooltip'
import { type MapControl } from '@/types'
import { StandardsColorSpan, StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export interface ControlChipProps {
  control: MapControl
  selected?: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLSpanElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLSpanElement>) => void
  removable?: boolean
  onRemove?: (control: MapControl) => void
  className?: string
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void
  onContextMenu?: (e: React.MouseEvent<HTMLSpanElement>, control: MapControl) => void
  hideStandard?: boolean
  clickable?: boolean
  disableHref?: boolean
  hideHexagon?: boolean
  forceHref?: string
  canAdd?: boolean
  onAdd?: (control: MapControl) => void
}

const ControlChip: React.FC<ControlChipProps> = ({
  control,
  draggable = false,
  onDragStart,
  onDragEnd,
  removable = false,
  onRemove,
  className = '',
  selected,
  onClick,
  onContextMenu,
  hideStandard,
  clickable = true,
  disableHref,
  hideHexagon,
  forceHref,
  canAdd,
  onAdd,
}) => {
  const baseClasses = 'bg-secondary flex gap-1 items-center'
  const dragClass = draggable ? 'cursor-grab' : ''
  const borderClass = selected ? 'ring-1' : 'border-border'
  const subcontrolHref = control.controlID ? `/controls/${control.controlID}/${control.id}` : null
  const href = forceHref || (control.__typename === ObjectTypes.SUBCONTROL ? subcontrolHref : `/controls/${control.id}`)

  if (!control) {
    return
  }

  const renderedBadge = () => (
    <Badge
      onClick={onClick}
      variant="outline"
      className={`${baseClasses} ${dragClass} ${borderClass} ${className}`}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu?.(e, control)
      }}
    >
      {draggable && <Drag strokeWidth={1} className="text-border" />}
      {!hideHexagon && <StandardsHexagon shortName={control.referenceFramework ?? ''} />}
      {!hideStandard && (
        <>
          <StandardsColorSpan shortName={control.referenceFramework || ''}>{control.referenceFramework || 'CUSTOM'}</StandardsColorSpan>
          <span className="text-border">|</span>
        </>
      )}
      <span>{control.refCode || ''}</span>
      {removable && onRemove && (
        <button
          type="button"
          aria-label={`Remove ${control.refCode || 'control'}`}
          className="cursor-pointer ml-1 bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onRemove(control)
          }}
        >
          <XIcon size={12} />
        </button>
      )}
      {canAdd && onAdd && (
        <button
          type="button"
          aria-label={`Add ${control.refCode || 'control'}`}
          className="cursor-pointer ml-1 bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onAdd(control)
          }}
        >
          <Plus size={12} />
        </button>
      )}
    </Badge>
  )

  return (
    <ControlHoverCard id={control.id} isSubcontrol={control.__typename === ObjectTypes.SUBCONTROL} disableHref={disableHref} forceHref={forceHref}>
      {href && !disableHref && clickable ? <NextLink href={href}>{renderedBadge()}</NextLink> : <div>{renderedBadge()}</div>}
    </ControlHoverCard>
  )
}

export default React.memo(ControlChip)
