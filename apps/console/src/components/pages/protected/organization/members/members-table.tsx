'use client'

import { GetSingleOrganizationMembersQuery, GetSingleOrganizationMembersQueryVariables, useGetSingleOrganizationMembersQuery, UserAuthProvider } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { pageStyles } from './page.styles'
import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Copy, KeyRoundIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import Image from 'next/image'
import { format } from 'date-fns'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { useToast } from '@repo/ui/use-toast'
import { MemberActions } from './actions/member-actions'

type MembersTableProps = {
  setActiveTab: Dispatch<SetStateAction<string>>
}

type Member = NonNullable<NonNullable<GetSingleOrganizationMembersQuery['organization']>['members']>[number]

export const MembersTable = ({ setActiveTab }: MembersTableProps) => {
  const { membersSearchRow, membersSearchField, membersButtons, nameRow, copyIcon } = pageStyles()
  const { data: session } = useSession()
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const { toast } = useToast()

  const variables: GetSingleOrganizationMembersQueryVariables = {
    organizationId: session?.user.activeOrganizationId ?? '',
  }

  const [{ data, fetching, error }, refetch] = useGetSingleOrganizationMembersQuery({
    variables,
    pause: !session,
  })

  useEffect(() => {
    if (copiedText) {
      toast({
        title: 'Copied to clipboard',
        variant: 'success',
      })
    }
  }, [copiedText])

  useEffect(() => {
    if (data?.organization?.members) {
      setFilteredMembers(data.organization.members)
    }
  }, [data])

  if (error || fetching) return null

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase()
    setSearchTerm(searchValue)

    if (data?.organization?.members) {
      const filtered = data.organization.members.filter(({ user: { firstName, lastName } }) => {
        const fullName = `${firstName?.toLowerCase() ?? ''} ${lastName?.toLowerCase() ?? ''}`
        return fullName.includes(searchValue)
      })
      setFilteredMembers(filtered)
    }
  }

  const providerIcon = (provider: UserAuthProvider) => {
    switch (provider) {
      case UserAuthProvider.GOOGLE:
        return <Image src="/icons/brand/google.svg" width={18} height={18} alt="" />
      case UserAuthProvider.GITHUB:
        return <Image src="/icons/brand/github.svg" width={18} height={18} alt="" />
      default:
        return <KeyRoundIcon width={18} />
    }
  }

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'user.id',
      header: '',
      cell: ({ row }) => {
        const image = row.original.user.avatarFile?.presignedURL || row.original.user.avatarRemoteURL
        return (
          <Avatar variant="small">
            {image && <AvatarImage src={image} />}
            <AvatarFallback>{row.original.user.firstName?.substring(0, 2)}</AvatarFallback>
          </Avatar>
        )
      },
      size: 40,
    },
    {
      accessorKey: 'user.firstname',
      header: 'Name',
      cell: ({ row }) => {
        const fullName = `${row.original.user.firstName} ${row.original.user.lastName}` || ''

        return (
          <div className={nameRow()}>
            {`${row.original.user.firstName} ${row.original.user.lastName}`}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => copyToClipboard(fullName)} />
          </div>
        )
      },
    },
    {
      accessorKey: 'user.email',
      header: 'Email',
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ cell }) => format(new Date(cell.getValue() as string), 'd MMM yyyy'),
    },
    {
      accessorKey: 'user.authProvider',
      header: 'Provider',
      cell: ({ cell }) => <>{providerIcon(cell.getValue() as UserAuthProvider)}</>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ cell }) => <>{cell.getValue() as React.ReactNode}</>,
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => <MemberActions memberId={cell.getValue() as string} refetchMembers={refetch} />,
      size: 40,
    },
  ]

  return (
    <div>
      <div className={membersSearchRow()}>
        <div className={membersSearchField()}>
          <Input placeholder="Search for user" value={searchTerm} onChange={handleSearch} />
        </div>
        <div className={membersButtons()}>
          <Button size="md" icon={<PlusIcon />} iconPosition="left" onClick={() => setActiveTab('invites')}>
            Send an invite
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredMembers} />
    </div>
  )
}
