'use client'

import { useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { ControlObjectiveControlSource, ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Archive, FilePenLineIcon, ThumbsUp } from 'lucide-react'

interface Props {
  obj: ControlObjectiveFieldsFragment
}

export const ControlObjectiveCard = ({ obj }: Props) => {
  const plateEditorHelper = usePlateEditor()
  const [hoveredControl, setHoveredControl] = useState<{
    id: string
    shortName: string
    description: string
  } | null>(null)

  const [hoveredSubcontrol, setHoveredSubcontrol] = useState<{
    id: string
    parentRefCode: string
    parentDescription: string
  } | null>(null)

  return (
    <Card className="p-4 flex">
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          {/* Status */}
          <div className="flex items-start border-b">
            <div className="min-w-32">Status</div>
            <div>{renderStatusIcon(obj?.status)}</div>
          </div>

          {/* Type */}
          <div className="flex items-start border-b">
            <div className="min-w-32 pl-5 border-l mb-2">Type</div>
            <div>{obj.controlObjectiveType || '—'}</div>
          </div>

          {/* Source */}
          <div className="flex items-start border-b">
            <div className="min-w-32">Source</div>
            <div>{renderSourceText(obj?.source)}</div>
          </div>

          {/* Category */}
          <div className="flex items-start border-b">
            <div className="min-w-32 pl-5 border-l mb-2">Category</div>
            <div>{obj.category || '—'}</div>
          </div>

          {/* Revision */}
          <div className="flex items-start border-b">
            <div className="min-w-32">Revision</div>
            <div>{obj.revision || 'v0.0.1'}</div>
          </div>

          {/* Subcategory */}
          <div className="flex items-start border-b">
            <div className="min-w-32 pl-5 border-l mb-2">Subcategory</div>
            <div>{obj.subcategory || '—'}</div>
          </div>
        </div>

        <div className="mt-5">{plateEditorHelper.convertToReadOnly(obj.desiredOutcome || '', 0)}</div>
      </div>

      <div className="w-px bg-border self-stretch mx-6" />

      <div className="w-[350px] flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg">Controls</p>
          <Button className="h-8">Link Controls</Button>
        </div>

        {!!obj.controls?.edges?.length && (
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {obj.controls.edges.map((control) => (
              <span
                key={control?.node?.id}
                onMouseEnter={() =>
                  setHoveredControl({
                    id: control?.node?.id || '',
                    shortName: control?.node?.standard?.shortName ?? '',
                    description: control?.node?.description ?? '',
                  })
                }
                onMouseLeave={() => setHoveredControl(null)}
                className="underline cursor-pointer text-blue-500"
              >
                {control?.node?.refCode}
              </span>
            ))}
          </div>
        )}

        {!!obj.subcontrols?.edges?.length && (
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {obj.subcontrols.edges.map((subcontrol) => {
              if (!subcontrol?.node) {
                return null
              }
              return (
                <span
                  key={subcontrol.node.id}
                  onMouseEnter={() =>
                    setHoveredSubcontrol({
                      id: subcontrol?.node?.id || '',
                      parentRefCode: 'C12345',
                      parentDescription: "The entity identifies and maintains confidential information to meet the entity's objectives related to confidentiality.", // Replace with actual data
                    })
                  }
                  onMouseLeave={() => setHoveredSubcontrol(null)}
                  className="underline cursor-pointer text-blue-500"
                >
                  {subcontrol?.node?.refCode}
                </span>
              )
            })}
          </div>
        )}

        {hoveredSubcontrol && (
          <div className="text-xs border border-border rounded-md p-4 grid grid-cols-[auto,1fr] gap-y-3 gap-x-5">
            <span className="font-medium text-foreground">Parent control</span>
            <span className="text-blue-400 underline cursor-pointer">{hoveredSubcontrol.parentRefCode}</span>

            <span className="font-medium text-foreground">Details</span>
            <p className="text-muted-foreground leading-snug">{hoveredSubcontrol.parentDescription}</p>
          </div>
        )}

        {hoveredControl && (
          <div className="text-xs border border-border rounded-md p-4 grid grid-cols-[auto,1fr] gap-y-3 gap-x-5">
            <span className="font-medium text-foreground">Standard</span>
            <span className="text-blue-400 underline cursor-pointer">{hoveredControl.shortName}</span>

            <span className="font-medium text-foreground">Details</span>
            <p className="text-muted-foreground leading-snug">{hoveredControl.description}</p>
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
