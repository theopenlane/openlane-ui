'use client'

import { ColumnDef } from '@tanstack/react-table'
import { AllGroupsPaginatedFieldsFragment, InviteInviteStatus, InviteRole } from '@repo/codegen/src/schema.ts'
import { InviteActions } from '../actions/invite-actions'
import { formatDateSince } from '@/utils/date'
import { InvitationIconMapper, InvitationStatusMapper } from '@/components/shared/enum-mapper/invitation-enum'
import { UserRoleIconMapper } from '@/components/shared/enum-mapper/user-role-enum'
import { GlobeIcon, LockIcon, StarsIcon, Copy } from 'lucide-react'
import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { pageStyles } from '../page.styles'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { useNotification } from '@/hooks/useNotification'

export type InviteNode = {
  __typename?: 'Invite' | undefined
  id: string
  recipient: string
  status: InviteInviteStatus
  createdAt?: string
  role: InviteRole
  sendAttempts?: number
}

type TGroupTableForInvitesColumns = {
  selectedGroups: AllGroupsPaginatedFieldsFragment[]
  setSelectedGroups: React.Dispatch<React.SetStateAction<AllGroupsPaginatedFieldsFragment[]>>
  allGroups: AllGroupsPaginatedFieldsFragment[]
}

export const InvitesColumns = () => {
  const { copyIcon, nameRow } = pageStyles()
  const [, copyToClipboard] = useCopyToClipboard()
  const { successNotification } = useNotification()

  const handleCopy = (text: string) => {
    copyToClipboard(text)
    successNotification({
      title: 'Copied to clipboard',
      variant: 'success',
    })
  }

  const columns: ColumnDef<InviteNode>[] = [
    {
      accessorKey: 'recipient',
      header: () => <span className="whitespace-nowrap">Invited user</span>,
      cell: ({ row }) => {
        return (
          <div className={nameRow()}>
            {row.original.recipient}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => handleCopy(row.original.recipient)} />
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ cell }) => {
        const role = cell.getValue() as InviteRole
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

        return (
          <div className="flex gap-2 items-center">
            {UserRoleIconMapper[role]}
            {formattedRole}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => {
        const status = cell.getValue() as InviteInviteStatus
        return (
          <div className="flex gap-2 items-center">
            {InvitationIconMapper[status]}
            {InvitationStatusMapper[status]}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Sent',
      cell: ({ cell }) => formatDateSince(cell.getValue() as string),
    },

    {
      accessorKey: 'sendAttempts',
      header: () => <span className="whitespace-nowrap">Resend Attempts</span>,
      cell: ({ cell }) => `${cell.getValue() || 0}/5`,
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const invite = row.original
        return <InviteActions inviteId={invite.id} recipient={invite.recipient} role={invite.role} />
      },
    },
  ]

  return { columns }
}

export const groupTableForInvitesColumns = ({ allGroups, selectedGroups, setSelectedGroups }: TGroupTableForInvitesColumns) => {
  const columns: ColumnDef<AllGroupsPaginatedFieldsFragment>[] = [
    {
      id: 'check',
      header: () => {
        const isAllGroupsSelected = allGroups.length > 0 && allGroups.every((group) => selectedGroups.some((selectedGroup) => selectedGroup.id === group.id))
        const handleSelectAll = (checked: boolean) => {
          const pagedIds = new Set(allGroups.map((i) => i.id))

          setSelectedGroups((prev) => {
            if (checked) {
              const newItems = allGroups.filter((group) => !prev.some((p) => p.id === group.id))
              return [...prev, ...newItems]
            } else {
              return prev.filter((group) => !pagedIds.has(group.id))
            }
          })
        }

        return <Checkbox checked={isAllGroupsSelected} onCheckedChange={(checked) => handleSelectAll(!!checked)} />
      },

      cell: ({ row }) => {
        const item = row.original
        const isChecked = selectedGroups.some((selectedGroup) => selectedGroup.id === item.id)

        const handleToggle = (checked: boolean) => {
          setSelectedGroups((prev) => {
            if (checked) {
              if (prev.some((p) => p.id === item.id)) return prev
              return [...prev, item]
            } else {
              return prev.filter((sel) => sel.id !== item.id)
            }
          })
        }

        return <Checkbox checked={isChecked} onCheckedChange={(checked) => handleToggle(!!checked)} />
      },
      size: 50,
      maxSize: 50,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const isAutoGenerated = row.original.isManaged
        return (
          <div className="flex gap-2">
            {isAutoGenerated ? (
              <div className="flex gap-1">
                <StarsIcon className="mt-0.5" width={16} height={16} />
                <div className="flex flex-col gap-1">
                  <span className="text-sm whitespace-nowrap">{row.getValue('name')}</span>
                  <p className="text-xs text-text-light">Prebuilt</p>
                </div>
              </div>
            ) : (
              <span>{row.getValue('name')}</span>
            )}
          </div>
        )
      },
    },
    {
      header: 'Description',
      accessorKey: 'description',
    },
    {
      header: 'Visibility',
      accessorKey: 'visibility',
      cell: ({ row }) => {
        const value = row.original.setting?.visibility
        return (
          <span className="flex items-center gap-2 capitalize">
            {value === 'PUBLIC' ? <GlobeIcon height={18} /> : <LockIcon height={18} />}
            {value?.toLowerCase()}
          </span>
        )
      },
    },
  ]

  return columns
}
