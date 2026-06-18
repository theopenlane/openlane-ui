'use client'
import { Button } from '@repo/ui/button'
import { UsersRound } from 'lucide-react'
import { ManagementRow } from './management-row'
import { TransferOwnershipDialog } from './transfer-ownership-dialog'

const TRANSFER_OWNERSHIP_DESCRIPTION =
  'Organizations can have only one owner at a time. Transferring ownership will move ownership to another member and remove your owner privileges and demote you to Super Admin after transfer is accepted.'

const TransferOwnership = () => {
  return (
    <ManagementRow
      icon={<UsersRound className="size-5" />}
      iconClassName="bg-blue-500/15 text-blue-500"
      title="Transfer ownership"
      description={TRANSFER_OWNERSHIP_DESCRIPTION}
      action={
        <TransferOwnershipDialog
          trigger={
            <Button variant="outline" type="button" icon={<UsersRound />} iconPosition="left">
              Transfer ownership
            </Button>
          }
        />
      }
    />
  )
}

export { TransferOwnership }
