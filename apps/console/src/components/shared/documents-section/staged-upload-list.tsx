'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { FILE_CATEGORY_ENUM, type StagedUpload } from './staged-upload'

type StagedUploadListProps = {
  uploads: StagedUpload[]
  onChange: (id: string, changes: Partial<StagedUpload>) => void
  onRemove: (id: string) => void
}

const StagedUploadList: React.FC<StagedUploadListProps> = ({ uploads, onChange, onRemove }) => {
  const { enumOptions: categoryOptions, onCreateOption: createCategory } = useCreatableEnumOptions(FILE_CATEGORY_ENUM)

  return (
    <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
      {uploads.map((staged) => (
        <div key={staged.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <Label htmlFor={`${staged.id}-name`}>Name</Label>
            <Input id={`${staged.id}-name`} value={staged.name} placeholder={staged.file.name} onChange={(e) => onChange(staged.id, { name: e.currentTarget.value })} />
            <p className="truncate text-xs text-muted-foreground" title={staged.file.name}>
              {staged.file.name} &middot; {Math.round(staged.file.size / 1024)} KB
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:w-56">
            <Label htmlFor={`${staged.id}-category`}>Category</Label>
            <CreatableCustomTypeEnumSelect
              triggerId={`${staged.id}-category`}
              value={staged.category}
              options={categoryOptions}
              onValueChange={(value) => onChange(staged.id, { category: value })}
              onCreateOption={createCategory}
              placeholder="Select category"
              searchPlaceholder="Search or create..."
            />
          </div>
          <Button type="button" variant="secondary" className="shrink-0 sm:mt-6" aria-label={`Remove ${staged.file.name}`} onClick={() => onRemove(staged.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
    </div>
  )
}

export { StagedUploadList }
