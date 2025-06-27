import React, { JSX } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '@repo/ui/button'

interface MenuProps {
  trigger?: React.ReactNode
  content: React.ReactNode | JSX.Element
  align?: 'start' | 'center' | 'end'
}

const Menu: React.FC<MenuProps> = ({ trigger, content, align }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger ?? <Button variant="outline" className="h-8 !px-2 !pl-0 bg-card" icon={<EllipsisVertical size={16} />} />}</DropdownMenuTrigger>
      <DropdownMenuContent className="border shadow-md" align={align ?? 'end'}>
        <div className="flex flex-col space-y-2">{content}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Menu
