import React, { useState } from 'react'
import { ExternalLink, Info, PencilLine, SlidersHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import ObjectsChip from '../objects-chip/objects-chip'
import { useSheetNavigation, SHEET_KINDS, FULL_PAGE_KINDS } from '@/providers/sheet-navigation-provider'
import { useRouter } from 'next/navigation'
import { getAssociationDisplayModel } from '@/components/shared/object-association/utils'

export interface ObjectChipProps {
  object: {
    id: string
    refCode?: string | null
    displayName?: string | null
    name?: string | null
    fullName?: string | null
    title?: string | null
    description?: string | null
    desiredOutcome?: string | null
    details?: string | null
    summary?: string | null
    identityHolderType?: string | null
    link: string
  }
  kind?: string
  removable?: boolean
  onRemove?: () => void
  onItemClick?: (id: string, kind: string) => void
}

const ObjectAssociationChip: React.FC<ObjectChipProps> = ({ object, kind, removable, onRemove, onItemClick }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const { convertToReadOnly } = usePlateEditor()
  const router = useRouter()

  const display = getAssociationDisplayModel(object, kind)

  const objectKind = kind || ''
  const sheetNavigation = useSheetNavigation()

  const handleNavigate = () => {
    if (onItemClick) {
      onItemClick(object.id, objectKind)
    } else if (sheetNavigation && SHEET_KINDS.has(objectKind)) {
      sheetNavigation.openSheet(object.id, objectKind)
    } else if (FULL_PAGE_KINDS.has(objectKind) && object.link) {
      router.push(object.link)
    } else {
      window.open(object.link, '_blank')
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger
          className="bg-transparent"
          onClick={(e) => {
            e.preventDefault()
            handleNavigate()
          }}
        >
          <ObjectsChip name={display.name} objectType={objectKind} removable={removable} onRemove={onRemove ? () => onRemove() : undefined} onClick={handleNavigate} />
        </TooltipTrigger>

        <TooltipContent side="top" className="p-3 rounded-md shadow-lg text-xs min-w-60">
          <div>
            <div className="grid grid-cols-[auto_1fr] gap-y-2">
              <div className="flex items-center gap-1 border-b pb-2">
                <SlidersHorizontal size={12} />
                <span className="font-medium">Name</span>
              </div>
              <div className="w-full border-b pb-2">
                <span className="text-brand pl-3 cursor-pointer hover:underline inline-flex items-center gap-1" onClick={handleNavigate}>
                  {display.name}
                  <ExternalLink size={12} />
                </span>
              </div>

              {display.showType && (
                <>
                  <div className="flex items-center gap-1 border-b pb-2 pt-2">
                    <Info size={12} />
                    <span className="font-medium">Type</span>
                  </div>
                  <div className="w-full border-b pb-2 pt-2">
                    <span className="pl-3 wrap-break-word">{display.typeLabel}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col pt-2">
              <div className="flex items-center gap-1">
                <PencilLine size={12} />
                <span className="font-medium">{display.detailLabel}</span>
              </div>
              <div className="max-w-xs text-justify line-clamp-4">{display.detailContentIsRichText ? convertToReadOnly(display.detailContent) : display.detailContent}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ObjectAssociationChip
