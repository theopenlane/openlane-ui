import { useRouter } from 'next/navigation'
import { pageStyles } from './page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { CirclePlus, FilePlus, LayoutTemplate, SquarePlus } from 'lucide-react'
import { TemplateList } from './templates'
import React, { useState } from 'react'
import { AlertDialog } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'

const ICON_SIZE = 12

export const CreateDropdown = () => {
  const router = useRouter()

  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false)

  const handleCreateNew = () => {
    router.push('/questionnaires/questionnaire-editor')
  }

  const { buttons } = pageStyles()

  return (
    <div className={buttons()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" onClick={handleCreateNew} className="h-8 !px-2 !pl-3 btn-secondary" icon={<SquarePlus />} iconPosition="left">
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

      <AlertDialog open={isTemplateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <TemplateList />
      </AlertDialog>
    </div>
  )
}
