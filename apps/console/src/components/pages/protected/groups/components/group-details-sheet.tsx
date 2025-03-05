'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { GlobeIcon, Info, Link, Tag, User, Pencil, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import GroupsMembersTable from './groups-members-table'
import { Card } from '@repo/ui/cardpanel'
import DeleteGroupDialog from './dialogs/delete-group-dialog'
import AddMembersDialog from './dialogs/add-members-dialog'
import AssignPermissionsDialog from './dialogs/assign-permissions-dialog'
import GroupsPermissionsTable from './groups-permissions-table'
import InheritPermissionDialog from './dialogs/inherit-permission-dialog'
import { GroupSettingVisibility, GroupMembershipRole } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { Input } from '@repo/ui/input'
import { useSession } from 'next-auth/react'
import { useGetGroupDetails, useUpdateGroup } from '@/lib/graphql-hooks/groups'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'

const EditGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  visibility: z.enum(['Public', 'Private']),
  tags: z.array(z.object({ value: z.string(), label: z.string() })),
})

type EditGroupFormData = z.infer<typeof EditGroupSchema>

const GroupDetailsSheet = () => {
  const { data: sessionData } = useSession()
  const [activeTab, setActiveTab] = useState<'Members' | 'Permissions'>('Members')
  const [isEditing, setIsEditing] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedGroup, setSelectedGroup, setIsAdmin, isAdmin } = useGroupsStore()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const { data, isPending: fetching } = useGetGroupDetails(selectedGroup)

  const { name, description, members, setting, tags, id, isManaged } = data?.group || {}

  const { mutateAsync: updateGroup } = useUpdateGroup()

  const { control, handleSubmit, reset } = useForm<EditGroupFormData>({
    resolver: zodResolver(EditGroupSchema),
    defaultValues: {
      groupName: name || '',
      description: description || '',
      visibility: setting?.visibility === GroupSettingVisibility.PUBLIC ? 'Public' : 'Private',
      tags: tags?.map((tag) => ({ value: tag, label: tag })) || [],
    },
  })

  const handleCopyLink = () => {
    if (!selectedGroup) return

    const url = `${window.location.origin}${window.location.pathname}?groupid=${selectedGroup}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  const handleSheetClose = () => {
    if (isEditing) {
      const confirmClose = window.confirm('You have unsaved changes. Do you want to discard them?')
      if (!confirmClose) return
    }

    setSelectedGroup(null)
    setIsEditing(false)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('groupid')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }
  const onSubmit = async (data: EditGroupFormData) => {
    if (!selectedGroup || !id) return

    try {
      await updateGroup({
        updateGroupId: id,
        input: {
          name: data.groupName,
          description: data.description,
          tags: data.tags.map((t) => t.value),
          updateGroupSettings: {
            visibility: data.visibility === 'Public' ? GroupSettingVisibility.PUBLIC : GroupSettingVisibility.PRIVATE,
          },
        },
      })

      queryClient.invalidateQueries({
        predicate: (query) => {
          const [firstKey, secondKey] = query.queryKey
          return firstKey === 'groups' || (firstKey === 'group' && secondKey === id)
        },
      })
      successNotification({ title: 'Group updated successfully!' })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating group:', error)
      errorNotification({ title: 'Failed to update group.' })
    }
  }

  useEffect(() => {
    if (data) {
      reset({
        groupName: name || '',
        description: description || '',
        visibility: setting?.visibility === GroupSettingVisibility.PUBLIC ? 'Public' : 'Private',
        tags: tags?.map((tag) => ({ value: tag, label: tag })) || [],
      })
      const userRole = data.group.members?.find((membership) => membership.user.id === sessionData?.user.userId)?.role
      if (userRole) {
        setIsAdmin(userRole === GroupMembershipRole.ADMIN)
      }
    }
  }, [data, reset, name, description, setting, tags])

  useEffect(() => {
    const groupId = searchParams.get('groupid')
    if (groupId) {
      setSelectedGroup(groupId)
    }
  }, [searchParams, setSelectedGroup])

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
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} icon={<Check />} iconPosition="left">
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button disabled={!!isManaged || !isAdmin} icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Group
                  </Button>
                )}

                <DeleteGroupDialog />
              </div>
            </SheetHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <SheetTitle>{isEditing ? <Controller name="groupName" control={control} render={({ field }) => <Input {...field} placeholder="Group name" />} /> : name}</SheetTitle>
              <SheetDescription>
                {isEditing ? <Controller name="description" control={control} render={({ field }) => <Textarea {...field} placeholder="Add a description" />} /> : description}
              </SheetDescription>
              <div>
                <div className="flex flex-col gap-4 mt-5">
                  <div className="flex items-center gap-4">
                    <GlobeIcon height={16} width={16} color="#2CCBAB" />
                    <p className="text-sm">Visibility:</p>
                    {isEditing ? (
                      <Controller
                        name="visibility"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>{field.value}</SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Public">Public</SelectItem>
                              <SelectItem value="Private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <p className="capitalize text-sm">{setting?.visibility.toLowerCase()}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <User height={16} width={16} color="#2CCBAB" />
                    <p className="text-sm">Members:</p>
                    <p className="text-sm">{members?.length}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Tag height={16} width={16} color="#2CCBAB" />
                    <p className="text-sm">Tags:</p>
                    {isEditing ? (
                      <Controller name="tags" control={control} render={({ field }) => <MultipleSelector value={field.value} creatable defaultOptions={field.value} onChange={field.onChange} />} />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags?.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
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
                <div className="mt-7">{activeTab === 'Members' ? <GroupsMembersTable /> : <GroupsPermissionsTable />}</div>
              </div>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default GroupDetailsSheet
