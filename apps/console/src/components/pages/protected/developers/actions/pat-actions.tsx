'use client'

import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useDeletePersonalAccessTokenMutation } from '@repo/codegen/src/schema'
import { type UseQueryExecute } from 'urql'

type TokenActionProps = {
  tokenId: string
  refetchTokens: UseQueryExecute
}

const ICON_SIZE = 12

export const TokenAction = ({ tokenId, refetchTokens }: TokenActionProps) => {
  const { actionIcon } = pageStyles()
  const { toast } = useToast()
  const [_, deleteToken] = useDeletePersonalAccessTokenMutation()

  const handleDeleteToken = async () => {
    const response = await deleteToken({ deletePersonalAccessTokenId: tokenId })

    if (response.error) {
      toast({
        title: 'There was a problem deleting this token, please try again',
        variant: 'destructive',
      })
    }

    if (response.data) {
      toast({
        title: 'Token deleted successfully',
        variant: 'success',
      })
      refetchTokens({
        requestPolicy: 'network-only',
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MoreHorizontal className={actionIcon()} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-10">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center cursor-pointer">
                  <Trash2 width={ICON_SIZE} className="mr-2" />
                  Delete token
                </div>
              </DialogTrigger>
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
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
