import React, { useState } from 'react'
import NextLink from 'next/link'
import { ExternalLink, FileText, Folder, FolderPlus, PencilLine, SlidersHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Link } from '@/components/shared/link/link'
import { useGetControlMinifiedById } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolMinifiedById } from '@/lib/graphql-hooks/subcontrol'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

type TControlCardProps = {
  id: string
  isSubcontrol: boolean
  disableHref?: boolean
  forceHref?: string
  header?: React.ReactNode
}

const ControlTooltipContent: React.FC<TControlCardProps> = ({ id, isSubcontrol, disableHref, forceHref, header }) => {
  const { convertToReadOnly } = usePlateEditor()

  const { data: ctrlData, isLoading: ctrlLoading } = useGetControlMinifiedById(isSubcontrol ? undefined : id)
  const { data: subData, isLoading: subLoading } = useGetSubcontrolMinifiedById(isSubcontrol ? id : undefined)

  const loading = ctrlLoading || subLoading
  const details = ctrlData?.control || subData?.subcontrol

  const nameHref = forceHref || (isSubcontrol ? getHrefForObjectType('subcontrols', { id, controlId: subData?.subcontrol.control.id }) : getHrefForObjectType('controls', { id }))
  const standardHref = `/standards/${isSubcontrol ? subData?.subcontrol?.control?.standardID : ctrlData?.control.standardID}`

  const headerBlock = header && <div className="mb-2 border-b pb-2 italic text-muted-foreground">{header}</div>

  if (loading || !details) {
    return (
      <div className="text-xs">
        {headerBlock}
        <p>{loading ? 'Loading details…' : 'No details available.'}</p>
      </div>
    )
  }

  const name = details.title ? `${details.refCode} ${details.title}` : details.refCode

  return (
    <div className="bg-background-secondary p-3 rounded-md text-xs min-w-[240px] max-w-[320px]">
      {headerBlock}
      <div className="grid grid-cols-[auto_1fr] gap-y-2">
        <div className="flex items-center gap-1 border-b pb-2">
          <SlidersHorizontal size={12} />
          <span className="font-medium">Name</span>
        </div>
        <div className="w-full border-b">
          {disableHref ? (
            <span className="pl-3">{name}</span>
          ) : (
            <Link href={nameHref} newTab className="size-fit pl-3">
              {name}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 border-b pb-2">
          <FileText size={12} />
          <span className="font-medium">Standard</span>
        </div>
        <div className="flex items-center gap-1 border-b pb-2">
          <NextLink href={standardHref} className="size-fit hover:underline flex items-center gap-1" target="_blank" rel="noopener">
            <StandardChip referenceFramework={details.referenceFramework ?? ''} />
            {details.referenceFramework && <ExternalLink size={12} />}
          </NextLink>
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

type TControlHoverCardProps = TControlCardProps & {
  children: React.ReactElement
}

export const ControlHoverCard: React.FC<TControlHoverCardProps> = ({ children, ...card }) => {
  const [open, setOpen] = useState(false)

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={300} disableHoverableContent={false}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {open && (
        <TooltipContent side="top" collisionPadding={64} portal>
          <ControlTooltipContent {...card} />
        </TooltipContent>
      )}
    </Tooltip>
  )
}
