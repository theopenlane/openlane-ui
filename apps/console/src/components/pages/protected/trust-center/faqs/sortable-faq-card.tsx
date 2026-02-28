import { UseFormReturn } from 'react-hook-form'
import { GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Label } from '@repo/ui/label'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { TrustCenterFaqsNodeNonNull } from '@/lib/graphql-hooks/trust-center-faq'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FaqFormValues } from './hooks/use-form-schema'

interface SortableFaqCardProps {
  faq: TrustCenterFaqsNodeNonNull
  isEditing: boolean
  editingId: string | null
  onStartEdit: (faq: TrustCenterFaqsNodeNonNull) => void
  onDelete: (id: string) => void
  editForm: UseFormReturn<FaqFormValues>
  isUpdating: boolean
  onSaveEdit: () => void
  onCancelEdit: () => void
}

export function SortableFaqCard({ faq, isEditing, editingId, onStartEdit, onDelete, editForm, isUpdating, onSaveEdit, onCancelEdit }: SortableFaqCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: faq.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <Label>Question</Label>
              <Input autoFocus className="bg-background text-sm" {...editForm.register('question')} />
              {editForm.formState.errors.question && <p className="text-red-500 text-sm">{editForm.formState.errors.question.message}</p>}
              <Label>Answer</Label>
              <Textarea className="min-h-[100px] bg-background text-sm" {...editForm.register('answer')} />
              {editForm.formState.errors.answer && <p className="text-red-500 text-sm">{editForm.formState.errors.answer.message}</p>}
              <Label>Reference Link</Label>
              <Input className="bg-background text-sm" placeholder="https://..." {...editForm.register('referenceLink')} />
              {editForm.formState.errors.referenceLink && <p className="text-red-500 text-sm">{editForm.formState.errors.referenceLink.message}</p>}
              <div className="flex items-center justify-end">
                <div className="flex gap-2">
                  <CancelButton onClick={onCancelEdit}></CancelButton>
                  <SaveButton isSaving={isUpdating} onClick={onSaveEdit} disabled={isUpdating} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0 mt-1" {...attributes} {...listeners}>
                <GripVertical size={16} />
              </button>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">{faq.note.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.note.text}</p>
                {faq.referenceLink && (
                  <a href={faq.referenceLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center gap-1 mt-1 hover:underline w-fit">
                    <ExternalLink size={14} />
                    {faq.referenceLink}
                  </a>
                )}
                <div className="flex justify-end mt-1">
                  <div className="flex gap-3">
                    <button className="text-muted-foreground" onClick={() => onStartEdit(faq)} disabled={!!editingId}>
                      <Pencil size={16} />
                    </button>
                    <button className="text-muted-foreground" onClick={() => onDelete(faq.id)} disabled={!!editingId}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
