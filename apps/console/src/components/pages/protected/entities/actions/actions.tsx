'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type VendorActionsProps = {
  vendorId: string
}

const ICON_SIZE = 12

export const Actions = ({ vendorId: vendorId }: VendorActionsProps) => {
  const { actionIcon } = pageStyles()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const handleEditVendors = () => {
    console.log('edit vendors')
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <MoreHorizontal className={actionIcon()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-10">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={handleEditVendors}>
              <Edit width={ICON_SIZE} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash2 width={ICON_SIZE} /> Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
