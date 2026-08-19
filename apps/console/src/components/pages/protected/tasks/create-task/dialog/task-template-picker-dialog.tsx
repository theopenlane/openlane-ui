'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { LoaderCircle } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import { useTaskTemplates } from '@/lib/graphql-hooks/task'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'

const TASK_KIND_ENUM_WHERE = { objectType: 'task', field: 'kind' }
const NO_FILTER_CHANGE = () => {}

type TProps = {
  onOpenChange: (open: boolean) => void
  onSelect: (templateId: string) => void
  loadingTemplateId: string | null
}

const TaskTemplatePickerDialog: React.FC<TProps> = ({ onOpenChange, onSelect, loadingTemplateId }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { enumOptions: taskKindOptions } = useGetCustomTypeEnums({ where: TASK_KIND_ENUM_WHERE })
  const { templates, totalCount, isLoading } = useTaskTemplates({ searchTerm: debouncedSearch })

  const hasMore = totalCount > templates.length

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create task from template</DialogTitle>
          <DialogDescription>Pick a template to pre-fill the new task.</DialogDescription>
        </DialogHeader>

        <SearchFilterBar
          placeholder="Search templates"
          isSearching={searchTerm !== debouncedSearch}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filterFields={null}
          onFilterChange={NO_FILTER_CHANGE}
        />

        <div className="max-h-[340px] overflow-y-auto flex flex-col gap-2">
          {isLoading && <p className="text-sm text-muted-foreground py-4 text-center">Loading templates...</p>}
          {!isLoading && templates.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No templates found. Mark a task as a template to reuse it here.</p>}
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={!!loadingTemplateId}
              onClick={() => onSelect(template.id)}
              className="flex flex-col gap-1 items-start text-left border rounded-md p-3 bg-transparent hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm font-medium grow">{template.title}</span>
                {loadingTemplateId === template.id && <LoaderCircle className="animate-spin shrink-0" size={16} />}
                <CustomTypeEnumValue value={template.taskKindName ?? ''} options={taskKindOptions} placeholder="-" />
              </div>
              {template.tags && template.tags.length > 0 && <div className="flex flex-wrap gap-1">{template.tags.map((tag) => tag && <TagChip tag={tag} key={tag} />)}</div>}
            </button>
          ))}
          {hasMore && <p className="text-sm text-muted-foreground text-center">{`Showing ${templates.length} of ${totalCount} templates, refine your search to find more.`}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TaskTemplatePickerDialog
