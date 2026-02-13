import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { FilePlus, LayoutTemplate, SquarePlus } from 'lucide-react'
import { TemplateList } from './templates'
import React, { useState } from 'react'
import { Dialog } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'

const ICON_SIZE = 12

export const CreateDropdown = () => {
  const router = useRouter()

  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false)

  const handleCreateNew = () => {
    router.push('/questionnaires/questionnaire-editor')
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="primary" onClick={handleCreateNew} className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleCreateNew}>
            <FilePlus width={ICON_SIZE} className="text-muted-foreground" />
            From Scratch
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTemplateDialogOpen(true)
            }}
          >
            <LayoutTemplate width={ICON_SIZE} className="text-muted-foreground" />
            From Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <TemplateList />
      </Dialog>
    </div>
  )
}
