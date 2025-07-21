'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@repo/ui/cardpanel'
import { Popover } from '@repo/ui/popover'
import { PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { ControlObjectiveControlSource, ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Archive, FilePenLineIcon, ThumbsUp } from 'lucide-react'
import { LinkControlsModal } from './link-controls-modal'

interface Props {
  obj: ControlObjectiveFieldsFragment
}

export const ControlObjectiveCard = ({ obj }: Props) => {
  const plateEditorHelper = usePlateEditor()
  const convertToReadOnly = plateEditorHelper.convertToReadOnly

  const [hoveredControl, setHoveredControl] = useState<{
    id: string
    shortName: string
    description: string
  } | null>(null)

  const [hoveredSubcontrol, setHoveredSubcontrol] = useState<{
    id: string
    parentRefCode: string
    parentDescription: string
    parentId: string
  } | null>(null)

  return (
    <Card className="p-4 flex">
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          {/* Status */}
          <div className="flex items-start border-b pb-2">
            <div className="min-w-32">Status</div>
            <div>{renderStatusIcon(obj?.status)}</div>
          </div>

          {/* Type */}
          <div className="flex items-start border-b pb-2">
            <div className="min-w-32 pl-5 border-l h-full">Type</div>
            <div>{obj.controlObjectiveType || '—'}</div>
          </div>

          {/* Source */}
          <div className="flex items-start border-b pb-2">
            <div className="min-w-32">Source</div>
            <div>{renderSourceText(obj?.source)}</div>
          </div>

          {/* Category */}
          <div className="flex items-start border-b pb-2">
            <div className="min-w-32 pl-5 border-l h-full">Category</div>
            <div>{obj.category || '—'}</div>
          </div>

          {/* Revision */}
          <div className="flex items-start border-b pb-2">
            <div className="min-w-32">Revision</div>
            <div>{obj.revision || 'v0.0.1'}</div>
          </div>

          {/* Subcategory */}
          <div className="flex items-start border-b pb-2">
            <div className="min-w-32 pl-5 border-l h-full">Subcategory</div>
            <div>{obj.subcategory || '—'}</div>
          </div>
        </div>

        <div className="mt-5">{convertToReadOnly(obj.desiredOutcome || '')}</div>
      </div>

      <div className="w-px bg-border self-stretch mx-6" />

      <div className="w-[350px] flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg">Controls</p>
          <LinkControlsModal controlObjectiveData={obj} />
        </div>

        {/* Controls with popover */}
        {!!obj.controls?.edges?.length && (
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {obj.controls.edges.map((control) =>
              control?.node ? (
                <Popover key={control.node.id} open={control.node.id === hoveredControl?.id}>
                  <div onMouseLeave={() => setHoveredControl(null)}>
                    <PopoverTrigger
                      asChild
                      onMouseEnter={() =>
                        setHoveredControl({
                          id: control?.node?.id || '',
                          shortName: control?.node?.standard?.shortName || '-',
                          description: control?.node?.description || '-',
                        })
                      }
                    >
                      <span className="pb-1">{control.node.refCode}</span>
                    </PopoverTrigger>
                    {hoveredControl?.id === control.node.id && (
                      <PopoverContent asChild align="start">
                        <div className="bg-background text-xs border border-border rounded-md p-4 grid grid-cols-[auto,1fr] gap-y-3 gap-x-5 max-w-xs">
                          <span className="font-medium">Standard</span>
                          <span>{hoveredControl.shortName}</span>

                          <span className="font-medium">Details</span>
                          <div>{convertToReadOnly(hoveredControl.description)}</div>
                        </div>
                      </PopoverContent>
                    )}
                  </div>
                </Popover>
              ) : null,
            )}
          </div>
        )}

        {/* Subcontrols with popover */}
        {!!obj.subcontrols?.edges?.length && (
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {obj.subcontrols.edges.map((subcontrol) =>
              subcontrol?.node ? (
                <Popover key={subcontrol.node.id} open={subcontrol.node.id === hoveredSubcontrol?.id}>
                  <div onMouseLeave={() => setHoveredSubcontrol(null)}>
                    <PopoverTrigger
                      asChild
                      onMouseEnter={() =>
                        setHoveredSubcontrol({
                          id: subcontrol?.node?.id || '',
                          parentRefCode: subcontrol?.node?.control?.refCode || '—',
                          parentDescription: subcontrol?.node?.control?.description || '—',
                          parentId: subcontrol?.node?.control?.id || '',
                        })
                      }
                    >
                      <span className="underline cursor-pointer  pb-1">{subcontrol.node.refCode}</span>
                    </PopoverTrigger>
                    {hoveredSubcontrol?.id === subcontrol.node.id && (
                      <PopoverContent asChild align="start">
                        <div className="bg-background text-xs border border-border rounded-md p-4 grid grid-cols-[auto,1fr] gap-y-3 gap-x-5 max-w-xs">
                          <span className="font-medium">Parent control</span>
                          <Link href={`/controls/${hoveredSubcontrol.parentId}`}>
                            <span className="text-blue-500 underline">{hoveredSubcontrol.parentRefCode}</span>
                          </Link>

                          <span className="font-medium">Details</span>
                          <div>{convertToReadOnly(hoveredSubcontrol.parentDescription)}</div>
                        </div>
                      </PopoverContent>
                    )}
                  </div>
                </Popover>
              ) : null,
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function renderSourceText(source?: ControlObjectiveControlSource | null) {
  switch (source) {
    case ControlObjectiveControlSource.FRAMEWORK:
      return 'Framework'
    case ControlObjectiveControlSource.IMPORTED:
      return 'Imported'
    case ControlObjectiveControlSource.TEMPLATE:
      return 'Template'
    case ControlObjectiveControlSource.USER_DEFINED:
      return 'User Defined'
    default:
      return '—'
  }
}

function renderStatusIcon(status?: ControlObjectiveObjectiveStatus | null) {
  switch (status) {
    case ControlObjectiveObjectiveStatus.DRAFT:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <FilePenLineIcon size={16} />
          Draft
        </span>
      )
    case ControlObjectiveObjectiveStatus.ACTIVE:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <ThumbsUp size={16} />
          Active
        </span>
      )
    case ControlObjectiveObjectiveStatus.ARCHIVED:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Archive size={16} />
          Archived
        </span>
      )
    default:
      return null
  }
}
