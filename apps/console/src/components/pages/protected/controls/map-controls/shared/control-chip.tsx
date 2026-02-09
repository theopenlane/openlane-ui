import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import Drag from '@/assets/Drag'
import { PencilLine, Plus, XIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { SlidersHorizontal, FileText, Folder, FolderPlus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useGetControlMinifiedById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolMinifiedById } from '@/lib/graphql-hooks/subcontrol'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { MapControl } from '@/types'
import { StandardsColorSpan, StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'
import StandardChip from '../../../standards/shared/standard-chip'
import { ControlType, SubcontrolType } from '@repo/codegen/src/type-names'

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
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const baseClasses = 'bg-secondary flex gap-1 items-center'
  const dragClass = draggable ? 'cursor-grab' : ''
  const borderClass = selected ? 'border-brand ring-1 ring-brand' : 'border-border'
  const href = forceHref || (control.__typename === SubcontrolType ? `/controls/${control.controlID}/${control.id}` : `/controls/${control.id}`)

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
        <XIcon
          size={12}
          className="cursor-pointer ml-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onRemove(control)
          }}
        />
      )}
      {canAdd && onAdd && (
        <Plus
          size={12}
          className="cursor-pointer ml-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onAdd(control)
          }}
        />
      )}
    </Badge>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>{!disableHref && clickable ? <Link href={href}>{renderedBadge()}</Link> : <div>{renderedBadge()}</div>}</TooltipTrigger>
        {tooltipOpen && (
          <TooltipContent side="top" collisionPadding={64}>
            <ControlTooltipContent control={control} disableHref={disableHref} forceHref={forceHref} />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

export default React.memo(ControlChip)

const ControlTooltipContent: React.FC<{ control: NonNullable<ControlChipProps['control']>; disableHref?: boolean; forceHref?: string }> = ({ control, disableHref, forceHref }) => {
  const { convertToReadOnly } = usePlateEditor()

  const { data: ctrlData, isLoading: ctrlLoading } = useGetControlMinifiedById(control.__typename === ControlType ? control.id : undefined)
  const { data: subData, isLoading: subLoading } = useGetSubcontrolMinifiedById(control.__typename === SubcontrolType ? control.id : undefined)

  const loading = ctrlLoading || subLoading
  const details = ctrlData?.control || subData?.subcontrol

  const nameHref = forceHref || (control.__typename === ControlType ? `/controls/${ctrlData?.control.id}` : `/controls/${subData?.subcontrol.control.id}/${subData?.subcontrol.id}`)

  const standardHref = control.__typename === SubcontrolType ? `/standards/${subData?.subcontrol?.control?.standardID}` : `/standards/${ctrlData?.control.standardID}`

  if (loading) return <p className="text-xs">Loading details…</p>
  if (!details) return <p className="text-xs">No details available.</p>

  return (
    <div className="bg-background-secondary p-3 rounded-md text-xs min-w-[240px] max-w-[320px]">
      <div className="grid grid-cols-[auto_1fr] gap-y-2">
        <div className="flex items-center gap-1 border-b pb-2">
          <SlidersHorizontal size={12} />
          <span className="font-medium">Name</span>
        </div>
        <div className="w-full border-b">
          {disableHref ? (
            <span className="pl-3">{details.title ? `${details.refCode} ${details.title}` : details.refCode}</span>
          ) : (
            <Link href={nameHref} className="size-fit pl-3 hover:underline flex items-center gap-1" target="_blank" rel="noopener">
              <span className="text-brand">{details.title ? `${details.refCode} ${details.title}` : details.refCode}</span>
              <ExternalLink size={12} />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 border-b pb-2">
          <FileText size={12} />
          <span className="font-medium">Standard</span>
        </div>
        <div className="flex items-center gap-1 border-b pb-2">
          <Link href={standardHref} className=" size-fit hover:underline flex items-center gap-1" target="_blank" rel="noopener">
            <StandardChip referenceFramework={details.referenceFramework ?? ''} />
            {details.referenceFramework && <ExternalLink size={12} />}
          </Link>
        </div>

        <div className="flex items-center gap-1 border-b pb-2">
          <Folder size={12} />
          <span className="font-medium">Category</span>
        </div>
        <span className="flex pl-3 gap-1 border-b pb-2">{details.category || '-'}</span>

        <div className="flex items-center gap-1 border-b pb-2">
          <FolderPlus size={12} />
          <span className="font-medium">Subcategory</span>
        </div>
        <span className="flex pl-3 gap-1 border-b pb-2">{details.subcategory || '-'}</span>
      </div>

      <div className="flex flex-col pt-2 max-w-full">
        <div className="flex items-center gap-1">
          <PencilLine size={12} />
          <span className="font-medium">Description</span>
        </div>
        <div className="line-clamp-4 text-justify break-words">{convertToReadOnly(details.description || '')}</div>
      </div>
    </div>
  )
}
