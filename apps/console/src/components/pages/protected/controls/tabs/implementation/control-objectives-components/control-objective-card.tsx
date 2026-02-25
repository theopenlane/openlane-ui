'use client'

import { Card } from '@repo/ui/cardpanel'
import { ControlObjectiveControlSource, ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Archive, FilePenLineIcon, ThumbsUp } from 'lucide-react'

interface Props {
  obj: ControlObjectiveFieldsFragment
  actions?: React.ReactNode
}

export const ControlObjectiveCard = ({ obj, actions }: Props) => {
  const plateEditorHelper = usePlateEditor()
  const convertToReadOnly = plateEditorHelper.convertToReadOnly

  return (
    <Card className="rounded-xl ">
      <div className="p-6">
        <div className="grid divide-y divide-border/60 text-sm sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-5">
          <div className="space-y-1 px-3">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Status</p>
            <div>{renderStatusIcon(obj?.status)}</div>
          </div>
          <div className="space-y-1 px-3">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Source</p>
            <div className="font-medium text-foreground">{renderSourceText(obj?.source)}</div>
          </div>
          <div className="space-y-1 px-3">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Revision</p>
            <div className="font-medium text-foreground">{obj.revision || 'v0.0.1'}</div>
          </div>
          <div className="space-y-1 px-3">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Type</p>
            <div className="font-medium text-foreground">{obj.controlObjectiveType || '—'}</div>
          </div>
          <div className="space-y-1 px-3 sm:pr-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Category</p>
            <div className="font-medium text-foreground">{obj.category || '—'}</div>
          </div>
        </div>
        <p className="text-sm mt-6 uppercase tracking-widest text-muted-foreground">Objectives</p>
        <div className="mt-2 text-sm text-foreground">{convertToReadOnly(obj.desiredOutcome || '—')}</div>
      </div>
      <div>
        <div className="border-t border-border p-6">{actions ? <div className=" flex items-center justify-end">{actions}</div> : null}</div>
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
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">
            <FilePenLineIcon size={16} />
          </span>
          <span className="text-sm">Draft</span>
        </div>
      )
    case ControlObjectiveObjectiveStatus.ACTIVE:
      return (
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">
            <ThumbsUp size={16} />
          </span>
          <span className="text-sm">Active</span>
        </div>
      )
    case ControlObjectiveObjectiveStatus.ARCHIVED:
      return (
        <div className="inline-flex justify-end gap-2">
          <span className="inline-flex gap-1 text-muted-foreground">
            <Archive size={16} />
          </span>
          <span className="text-sm">Archived</span>
        </div>
      )
    default:
      return null
  }
}
