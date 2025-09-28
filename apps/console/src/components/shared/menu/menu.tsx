import React, { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'
import { Button } from '@repo/ui/button'
import cn from 'classnames'

interface MenuProps {
  trigger?: React.ReactNode
  content: React.ReactNode | ((close: () => void) => React.ReactNode)
  extraContent?: React.ReactNode | ((close: () => void) => React.ReactNode)
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  closeOnSelect?: boolean
  className?: string
}

const Menu: React.FC<MenuProps> = ({ trigger, content, extraContent, align, side, closeOnSelect, className }) => {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    if (closeOnSelect) {
      setOpen(false)
    }
  }

  const renderContent = (node: typeof content) => {
    return typeof node === 'function' ? node(handleClose) : node
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger ?? <Button descriptiveTooltipText="Action" className="h-8 !px-2 !pl-0 " icon={<Ellipsis size={16} />} />}</DropdownMenuTrigger>
      <DropdownMenuContent className={cn('border shadow-md p-0 ', className)} align={align ?? 'end'} side={side ?? undefined}>
        <div className="flex flex-col space-y-2 px-3 py-3">{renderContent(content)}</div>
        {extraContent && (
          <>
            <div className="border-b" />
            <div className="flex flex-col space-y-2 px-3 py-2">{renderContent(extraContent)}</div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Menu
