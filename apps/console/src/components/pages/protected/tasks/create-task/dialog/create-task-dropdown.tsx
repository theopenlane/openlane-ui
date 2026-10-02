'use client'

import React, { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { FilePlus, LayoutTemplate, PlusCircle } from 'lucide-react'
import { CreateTaskDialog } from './create-task-dialog'
import CreateTaskFromTemplateDialog from './create-task-from-template-dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { tableActionAnchor } from '@/components/shared/element-anchor/element-anchor'

const createAnchor = tableActionAnchor(ObjectTypes.TASK, 'create')

const ICON_SIZE = 12

type TProps = {
  onSuccessWithId?: (id: string) => void
}

const CreateTaskDropdown: React.FC<TProps> = ({ onSuccessWithId }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="primary" className="h-8 px-2! pl-3!" icon={<PlusCircle />} iconPosition="left" {...createAnchor}>
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" aria-labelledby={createAnchor.id}>
          <DropdownMenuItem onSelect={() => setIsCreateOpen(true)} {...tableActionAnchor(ObjectTypes.TASK, 'create-from-scratch')}>
            <FilePlus width={ICON_SIZE} className="text-muted-foreground" />
            From Scratch
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsTemplatePickerOpen(true)} {...tableActionAnchor(ObjectTypes.TASK, 'create-from-template')}>
            <LayoutTemplate width={ICON_SIZE} className="text-muted-foreground" />
            From Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTaskDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccessWithId={onSuccessWithId} />
      <CreateTaskFromTemplateDialog open={isTemplatePickerOpen} onOpenChange={setIsTemplatePickerOpen} onSuccessWithId={onSuccessWithId} />
    </>
  )
}

export default CreateTaskDropdown
