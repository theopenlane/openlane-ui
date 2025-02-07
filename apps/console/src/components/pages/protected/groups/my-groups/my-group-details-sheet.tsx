'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { GlobeIcon, Info, Link, Tag, User } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import MyGroupsMembersTable from './my-groups-members-table'
import { Card } from '@repo/ui/cardpanel'
import EditGroupDialog from './dialogs/edit-group-dialog'
import DeleteGroupDialog from './dialogs/delete-group-dialog'
import AddMembersDialog from './dialogs/add-members-dialog'
import AssignPermissionsDialog from './dialogs/assign-permissions-dialog'
import MyGroupsPermissionsTable from './my-groups-permissions-table'
import InheritPermissionDialog from './dialogs/inherit-permission-dialog'
import { useGetGroupDetailsQuery } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import { useToast } from '@repo/ui/use-toast'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'

const GroupDetailsSheet = () => {
  const [activeTab, setActiveTab] = useState<'Members' | 'Permissions'>('Members')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedGroup, setSelectedGroup } = useMyGroupsStore()
  const { toast } = useToast()

  const [{ data, fetching }] = useGetGroupDetailsQuery({
    variables: { groupId: selectedGroup || '' },
    pause: !selectedGroup,
  })
  const { name, description, members, setting, tags } = data?.group || {}

  const handleCopyLink = () => {
    if (!selectedGroup) return

    const url = `${window.location.origin}${window.location.pathname}?groupid=${selectedGroup}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: 'Link copied to clipboard',
          variant: 'success',
        })
      })
      .catch(() => {
        toast({
          title: 'Failed to copy link',
          variant: 'destructive',
        })
      })
  }

  useEffect(() => {
    const groupId = searchParams.get('groupid')
    if (groupId) {
      setSelectedGroup(groupId)
    }
  }, [searchParams, setSelectedGroup])

  const handleSheetClose = () => {
    setSelectedGroup(null)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('groupid')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  return (
    <Sheet open={!!selectedGroup} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card">
        {fetching ? (
          <Loading />
        ) : (
          <>
            <SheetHeader>
              <div className="flex justify-end gap-2">
                <Button icon={<Link />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                  Copy link
                </Button>
                <EditGroupDialog />
                <DeleteGroupDialog />
              </div>
            </SheetHeader>
            <SheetTitle>{name}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
            <div>
              <div className="flex gap-6 mt-5">
                <div className="flex gap-2 flex-col">
                  <div className="flex items-center gap-1">
                    <GlobeIcon height={16} width={16} color="#2CCBAB" /> <p className="text-sm">Visibility:</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <User height={16} width={16} color="#2CCBAB" />
                    <p className="text-sm">Members:</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag height={16} width={16} color="#2CCBAB" />
                    <p className="text-sm">Tags:</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-col">
                  <p className="capitalize text-sm">{setting?.visibility.toLowerCase()}</p>
                  <p className="text-sm">{members?.length}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {tags?.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-9 flex gap-4">
                <AddMembersDialog />
                <AssignPermissionsDialog />
                <InheritPermissionDialog />
              </div>

              <Card className="mt-6 p-4 flex gap-3">
                <Info className="mt-1" width={16} height={16} />
                <div>
                  <p className="font-semibold">Did you know?</p>
                  <p className="text-sm">
                    Groups can be used to assign specific access to objects within the system. Please refer to our{' '}
                    <a href="https://docs.theopenlane.io/docs/docs/platform/security/authorization/permissions" target="_blank" className="text-brand hover:underline">
                      documentation
                    </a>
                    .
                  </p>
                </div>
              </Card>

              <div className="mt-9 flex">
                <p
                  className={`px-4 py-2 text-sm font-semibold w-1/2 text-center border-b-2 cursor-pointer ${activeTab === 'Members' ? 'border-brand text-brand' : ''}`}
                  onClick={() => setActiveTab('Members')}
                >
                  Members
                </p>

                <p
                  className={`px-4 py-2 text-sm font-semibold w-1/2 text-center border-b-2 cursor-pointer ${activeTab === 'Permissions' ? 'border-brand text-brand' : ''}`}
                  onClick={() => setActiveTab('Permissions')}
                >
                  Permissions
                </p>
              </div>
              <div className="mt-7">{activeTab === 'Members' ? <MyGroupsMembersTable /> : <MyGroupsPermissionsTable />}</div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default GroupDetailsSheet
