'use client'

import { Card } from '@repo/ui/cardpanel'
import { ControlImplementationDocumentStatus, type ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { VerifiedLabel } from '@/components/pages/protected/control-implementations/verified-label'
import { formatDate } from '@/utils/date'
import { ControlImplementationIconMap } from '@/components/shared/enum-mapper/control-enum'

interface Props {
  obj: ControlImplementationFieldsFragment
  actions?: React.ReactNode
}

export const ControlImplementationCard = ({ obj, actions }: Props) => {
  const { convertToReadOnly } = usePlateEditor()

  return (
    <Card className="rounded-xl ">
      <div className="p-6">
        <div className="grid divide-y divide-border/60 text-sm sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          <div className="space-y-1 px-3">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Status</p>
            <div>{renderStatusIcon(obj?.status)}</div>
          </div>
          <div className="space-y-1 px-3 sm:pt-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Implementation Date</p>
            <div className="font-medium text-foreground">{obj.implementationDate ? formatDate(obj.implementationDate) : '—'}</div>
          </div>
          <div className="space-y-1 px-3 sm:pt-1 sm:pr-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Verified</p>
            <div className="font-medium text-foreground">
              <VerifiedLabel verified={obj.verified} />
            </div>
          </div>
        </div>
        <p className="text-sm mt-6 uppercase tracking-widest text-muted-foreground">Implementation</p>
        <div className="mt-2 text-sm text-foreground">{convertToReadOnly(obj.details || '—', 0)}</div>
      </div>
      {actions && (
        <div className="border-t border-border p-6">
          <div className="flex items-center justify-end">{actions}</div>
        </div>
      )}
    </Card>
  )
}

function renderStatusIcon(status?: string | null) {
  switch (status) {
    case ControlImplementationDocumentStatus.DRAFT:
      return (
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">{ControlImplementationIconMap[status]}</span>
          <span className="text-sm">Draft</span>
        </div>
      )
    case ControlImplementationDocumentStatus.APPROVED:
      return (
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">{ControlImplementationIconMap[status]}</span>
          <span className="text-sm">Approved</span>
        </div>
      )
    case ControlImplementationDocumentStatus.ARCHIVED:
      return (
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">{ControlImplementationIconMap[status]}</span>
          <span className="text-sm">Archived</span>
        </div>
      )

    case ControlImplementationDocumentStatus.NEEDS_APPROVAL:
      return (
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">{ControlImplementationIconMap[status]}</span>
          <span className="text-sm">Needs Approval</span>
        </div>
      )
    case ControlImplementationDocumentStatus.PUBLISHED:
      return (
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">{ControlImplementationIconMap[status]}</span>
          <span className="text-sm">Published</span>
        </div>
      )
    default:
      return '—'
  }
}
