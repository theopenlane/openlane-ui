'use client'

import React from 'react'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Callout } from '@/components/shared/callout/callout'
import { Check, ArrowUpRight } from 'lucide-react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type SuggestedTask } from '@/lib/suggested-tasks/types'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'

type SuggestedTaskDetailsSheetProps = {
  task: SuggestedTask | null
  onClose: () => void
  onComplete: (taskId: string) => void
}

const SuggestedTaskDetailsSheet: React.FC<SuggestedTaskDetailsSheetProps> = ({ task, onClose, onComplete }) => {
  const { convertToReadOnly } = usePlateEditor()

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        minWidth={420}
        resizable={false}
        header={
          task && (
            <SlideoutHeader
              title={task.title}
              aboveTitle={
                <Badge variant="outline" className="self-start" style={{ borderColor: task.taskKind.color, color: task.taskKind.color }}>
                  {task.taskKind.name}
                </Badge>
              }
              onClose={onClose}
              primaryAction={{
                label: 'Mark as complete',
                icon: <Check size={16} />,
                onClick: () => {
                  onComplete(task.id)
                  onClose()
                },
              }}
              menuActions={
                task.metadata.docsLink
                  ? [
                      {
                        key: 'docs',
                        label: 'Docs',
                        icon: <ArrowUpRight size={16} strokeWidth={2} />,
                        onClick: () => window.open(task.metadata.docsLink, '_blank', 'noopener,noreferrer'),
                      },
                    ]
                  : undefined
              }
            />
          )
        }
      >
        {task && (
          <div className="flex flex-col gap-5">
            <Callout variant="recommendation" compact title="Suggested by Openlane">
              We think this is a good next step based on where your organization is in its compliance journey
            </Callout>

            <div className="cursor-not-allowed">{convertToReadOnly(task.details)}</div>

            {task.metadata.references && task.metadata.references.length > 0 && (
              <Card className="p-4">
                <p className="text-md font-semibold mb-2">Resources</p>
                <div className="flex flex-col gap-2">
                  {task.metadata.references.map((reference) => (
                    <a key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-brand hover:underline">
                      {reference.name}
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default SuggestedTaskDetailsSheet
