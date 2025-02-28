'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { usePathname } from 'next/navigation'
import { useDeleteApiToken, useDeletePersonalAccessToken } from '@/lib/graphql-hooks/tokens'

type TokenActionProps = {
  tokenId: string
}

const ICON_SIZE = 12

export const TokenAction = ({ tokenId }: TokenActionProps) => {
  const { actionIcon } = pageStyles()
  const { toast } = useToast()
  const { mutateAsync: deletePersonalToken, error: isError } = useDeletePersonalAccessToken()
  const { mutateAsync: deleteApiToken, error } = useDeleteApiToken()
  const path = usePathname()
  const isOrg = path.includes('/organization-settings')

  const [menuOpen, setMenuOpen] = useState(false) // Track dropdown menu state
  const [dialogOpen, setDialogOpen] = useState(false) // Track dialog state

  const handleDeleteToken = async () => {
    const response = isOrg ? await deleteApiToken({ deleteAPITokenId: tokenId }) : await deletePersonalToken({ deletePersonalAccessTokenId: tokenId })

    if (error || isError) {
      toast({
        title: 'There was a problem deleting this token, please try again',
        variant: 'destructive',
      })
    } else if (response) {
      toast({
        title: 'Token deleted successfully',
        variant: 'success',
      })
      setDialogOpen(false)
      setMenuOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger className="cursor-pointer justify-self-end" asChild>
          <MoreHorizontal className={actionIcon()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-10">
          <DropdownMenuGroup>
            <DropdownMenuItem
              asChild
              onClick={() => {
                setMenuOpen(false)
                setDialogOpen(true)
              }}
            >
              <div className="flex items-center cursor-pointer">
                <Trash2 width={ICON_SIZE} className="mr-2" />
                Delete token
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete this token? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="filled" onClick={handleDeleteToken}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
