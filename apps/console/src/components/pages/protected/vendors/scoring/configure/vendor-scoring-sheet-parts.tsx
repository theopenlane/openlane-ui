import React from 'react'
import { Info } from 'lucide-react'

export type TQuestionEditor = { mode: 'add' } | { mode: 'edit'; draftId: string }

export type TDiscardTarget = 'sheet' | 'editor'

export const EDITOR_COPY: Record<TQuestionEditor['mode'], { title: string; note: string; saveLabel: string }> = {
  add: { title: 'Add a question', note: 'New questions apply to future answers.', saveLabel: 'Add question' },
  edit: { title: 'Edit question', note: 'Changes apply to answers recorded from now on.', saveLabel: 'Save question' },
}

export const DISCARD_COPY: Record<TDiscardTarget, { title: string; description: string }> = {
  sheet: { title: 'Discard your changes?', description: 'Your scoring changes have not been saved.' },
  editor: { title: 'Discard your edits?', description: 'Your edits to this question have not been applied.' },
}

export const BUILT_IN_LOCKS = { category: 'You cannot change the category for built-in questions.', answerType: 'You cannot change the answer type for built-in questions.' }

export const FooterNote = ({ children }: { children: React.ReactNode }) => (
  <p className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
    <Info size={14} className="shrink-0 text-warning" aria-hidden />
    {children}
  </p>
)
