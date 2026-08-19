'use client'

import React, { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { FilePlus, LayoutTemplate, PlusCircle } from 'lucide-react'
import { CreateTaskDialog } from './create-task-dialog'
import CreateTaskFromTemplateDialog from './create-task-from-template-dialog'

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
          <Button variant="primary" className="h-8 px-2! pl-3!" icon={<PlusCircle />} iconPosition="left">
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsCreateOpen(true)}>
            <FilePlus width={ICON_SIZE} className="text-muted-foreground" />
            From Scratch
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsTemplatePickerOpen(true)}>
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
