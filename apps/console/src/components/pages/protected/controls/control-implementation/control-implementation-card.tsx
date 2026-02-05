'use client'

import { useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { ControlImplementationDocumentStatus, ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/utils/date'
import { ControlImplementationIconMap } from '@/components/shared/enum-mapper/control-enum'
import { Popover } from '@repo/ui/popover'
import { PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import Link from 'next/link'
import ControlChip from '../map-controls/shared/control-chip'

interface Props {
  obj: ControlImplementationFieldsFragment
}

export const ControlImplementationCard = ({ obj }: Props) => {
  const { convertToReadOnly } = usePlateEditor()
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
    <Card className="p-4 flex ">
      <div className="flex-1 text-sm">
        {/* Status */}
        <div className="flex items-start border-b p-2">
          <div className="min-w-48 ">Status</div>
          <div className="flex flex-1 items-center gap-3">
            {renderStatusIcon(obj?.status)}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              {obj.verified ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-destructive" />}
              {obj.verified ? 'Verified' : 'Not verified'}
            </span>
          </div>
        </div>

        {/* Effective Date (Implementation Date) */}
        <div className="flex items-start border-b p-2">
          <div className="min-w-48 ">Effective Date</div>
          <div className="flex items-center gap-1 text-muted-foreground">{obj.implementationDate ? formatDate(obj.implementationDate) : '—'}</div>
        </div>

        {/* Verified Date */}
        <div className="flex items-start border-b p-2">
          <div className="min-w-48 ">Verified Date</div>
          <div className="flex items-center gap-1 text-muted-foreground">{obj.verificationDate ? formatDate(obj.verificationDate) : '—'}</div>
        </div>

        {/* Details */}
        <div className="mt-5">{convertToReadOnly(obj.details || '', 0)}</div>
      </div>

      <div className="w-px bg-border self-stretch mx-6" />

      {/* Controls/Subcontrols */}
      <div className="w-[350px] shrink-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg">Controls</p>
        </div>

        {!!obj.controls?.edges?.length && (
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {obj.controls.edges.map((control) =>
              control?.node ? (
                <Popover key={control?.node?.id} open={control?.node?.id === hoveredControl?.id}>
                  <div onMouseLeave={() => setHoveredControl(null)}>
                    <PopoverTrigger
                      asChild
                      onMouseEnter={() =>
                        setHoveredControl({
                          id: control?.node?.id || '',
                          shortName: control?.node?.referenceFramework || '-',
                          description: control?.node?.description || '-',
                        })
                      }
                    >
                      <ControlChip key={control.node.id} control={control.node} />
                    </PopoverTrigger>
                    {hoveredControl && (
                      <PopoverContent asChild align="start">
                        <div className="bg-background text-xs border border-boder rounded-md p-4 grid grid-cols-[auto,1fr] gap-y-3 gap-x-5 max-w-xs">
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
                          parentId: subcontrol?.node?.control?.id || '—',
                        })
                      }
                    >
                      <ControlChip key={subcontrol.node.id} control={subcontrol.node} />
                    </PopoverTrigger>
                    {hoveredSubcontrol && hoveredSubcontrol.id === subcontrol.node.id && (
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

function renderStatusIcon(status?: string | null) {
  switch (status) {
    case ControlImplementationDocumentStatus.DRAFT:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          {ControlImplementationIconMap[status]}
          Draft
        </span>
      )
    case ControlImplementationDocumentStatus.APPROVED:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          {ControlImplementationIconMap[status]}
          Approved
        </span>
      )
    case ControlImplementationDocumentStatus.ARCHIVED:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          {ControlImplementationIconMap[status]}
          Archived
        </span>
      )

    case ControlImplementationDocumentStatus.NEEDS_APPROVAL:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          {ControlImplementationIconMap[status]}
          Needs Approval
        </span>
      )
    case ControlImplementationDocumentStatus.PUBLISHED:
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          {ControlImplementationIconMap[status]}
          Published
        </span>
      )
    default:
      return '—'
  }
}
