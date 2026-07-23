'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { SearchIcon, SquareArrowOutUpRight } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { type Template } from '@repo/codegen/src/schema'

export type QuestionnaireTemplate = Pick<Template, 'id' | 'name' | 'description' | 'jsonconfig'>

const PREVIEW_PATH = '/automation/questionnaires/templates/template-viewer'
const CREATE_PATH = '/automation/questionnaires/templates/template-editor'

interface SelectQuestionnaireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: QuestionnaireTemplate[]
  isLoading: boolean
  selectedId?: string
  onSelect: (template: QuestionnaireTemplate) => void
}

export const SelectQuestionnaireDialog: React.FC<SelectQuestionnaireDialogProps> = ({ open, onOpenChange, templates, isLoading, selectedId, onSelect }) => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return templates
    return templates.filter((template) => template.name?.toLowerCase().includes(query) || template.description?.toLowerCase().includes(query))
  }, [templates, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Select Questionnaire</DialogTitle>
          <p className="text-sm text-muted-foreground">Choose an existing questionnaire to include in this campaign. Participants will complete it as part of the campaign.</p>
        </DialogHeader>

        <Input className="w-full" icon={<SearchIcon size={16} />} iconPosition="left" placeholder="Search questionnaires..." value={search} onChange={(e) => setSearch(e.currentTarget.value)} />

        <div className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading questionnaires...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No questionnaires found.</div>
          ) : (
            filtered.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template)}
                className={cn('flex items-start justify-between gap-4 p-3 text-left hover:bg-muted', selectedId === template.id && 'bg-muted')}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{template.name}</span>
                  {template.description && <span className="line-clamp-2 text-xs text-muted-foreground">{template.description}</span>}
                </span>
                <span
                  role="link"
                  tabIndex={0}
                  className="shrink-0 cursor-pointer text-sm text-brand"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`${PREVIEW_PATH}?id=${template.id}`, '_blank', 'noopener,noreferrer')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(`${PREVIEW_PATH}?id=${template.id}`, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  Preview
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Can&apos;t find what you&apos;re looking for?</span>
            <button type="button" className="inline-flex items-center gap-1 text-sm text-brand" onClick={() => window.open(CREATE_PATH, '_blank', 'noopener,noreferrer')}>
              Create new questionnaire <SquareArrowOutUpRight size={12} />
            </button>
          </div>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
