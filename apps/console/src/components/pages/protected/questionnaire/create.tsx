import { useRouter } from 'next/navigation'
import { pageStyles } from './page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { CirclePlus, FilePlus, LayoutTemplate } from 'lucide-react'
import { TemplateList } from './templates'
import React, { useState } from 'react'
import { AlertDialog } from '@repo/ui/alert-dialog'

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
          <div className="flex items-center space-x-2  cursor-pointer" onClick={handleCreateNew}>
            <CirclePlus size={16} strokeWidth={2} />
            <span>Questionnaire</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleCreateNew}>
            <FilePlus width={ICON_SIZE} />
            From Scratch
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTemplateDialogOpen(true)
            }}
          >
            <LayoutTemplate width={ICON_SIZE} />
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
