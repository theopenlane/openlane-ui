'use client'

import { useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { ControlImplementationDocumentStatus, ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Archive, CheckCircle, FilePenLineIcon, ThumbsUp, XCircle } from 'lucide-react'
import { LinkControlsModal } from './link-controls-modal'
import { formatDate } from '@/utils/date'
import { ControlImplementationIconMap } from '@/components/shared/icon-enum/control-enum'

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
  } | null>(null)

  return (
    <Card className="p-4 flex ">
      <div className="flex-1 text-sm">
        {/* Status */}
        <div className="flex items-start border-b p-2">
          <div className="min-w-48 ">Status</div>
          <div>{renderStatusIcon(obj?.status)}</div>
        </div>

        {/* Implementation Date */}
        <div className="flex items-start border-b p-2">
          <div className="min-w-48 ">Implementation Date</div>
          <div className="flex items-center gap-1 text-muted-foreground">{obj.implementationDate ? formatDate(obj.implementationDate) : '—'}</div>
        </div>

        {/* Verified */}
        <div className="flex items-start border-b p-2">
          <div className="min-w-48 ">Verified</div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {obj.verified ? (
              <>
                <CheckCircle size={16} className="text-green-500 mt-0.5" />
              </>
            ) : (
              <>
                <XCircle size={16} className="text-destructive mt-0.5" />
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-5">{convertToReadOnly(obj.details || '', 0)}</div>
      </div>

      <div className="w-px bg-border self-stretch mx-6" />

      {/* Controls/Subcontrols */}
      <div className="w-[350px] flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg">Controls</p>
          <LinkControlsModal
            updateControlImplementationId={obj.id}
            initialData={{
              controlIDs: obj.controls?.edges?.flatMap((edge) => edge?.node?.id || []),
              subcontrolIDs: obj.subcontrols?.edges?.flatMap((edge) => edge?.node?.id || []),
            }}
          />
        </div>

        {!!obj.controls?.edges?.length && (
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {obj.controls.edges.map((control) => (
              <span
                key={control?.node?.id}
                onMouseEnter={() =>
                  setHoveredControl({
                    id: control?.node?.id || '',
                    shortName: control?.node?.standard?.shortName || '-',
                    description: control?.node?.description || '-',
                  })
                }
                onMouseLeave={() => setHoveredControl(null)}
                className="underline cursor-pointer"
              >
                {control?.node?.refCode}
              </span>
            ))}
          </div>
        )}

        {!!obj.subcontrols?.edges?.length && (
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {obj.subcontrols.edges.map((subcontrol) =>
              subcontrol?.node ? (
                <span
                  key={subcontrol.node.id}
                  onMouseEnter={() =>
                    setHoveredSubcontrol({
                      id: subcontrol?.node?.id || '',
                      parentRefCode: subcontrol?.node?.control?.refCode || '—',
                      parentDescription: subcontrol?.node?.control?.description || '—',
                    })
                  }
                  onMouseLeave={() => setHoveredSubcontrol(null)}
                  className="underline cursor-pointer"
                >
                  {subcontrol.node.refCode}
                </span>
              ) : null,
            )}
          </div>
        )}

        {/* Hover Cards */}
        {hoveredSubcontrol && (
          <div className="text-xs border border-border rounded-md p-4 grid grid-cols-[auto,1fr] gap-y-3 gap-x-5">
            <span className="font-medium text-foreground">Parent control</span>
            <span className="underline cursor-pointer">{hoveredSubcontrol.parentRefCode}</span>

            <span className="font-medium text-foreground">Details</span>
            <div>{convertToReadOnly(hoveredSubcontrol.parentDescription, 0)}</div>
          </div>
        )}

        {hoveredControl && (
          <div className="text-xs border border-border rounded-md p-4 grid grid-cols-[auto,1fr] gap-y-3 gap-x-5">
            <span className="font-medium text-foreground">Standard</span>
            <span className="underline cursor-pointer">{hoveredControl.shortName}</span>

            <span className="font-medium text-foreground">Details</span>
            <div>{convertToReadOnly(hoveredControl.description, 0)}</div>
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
