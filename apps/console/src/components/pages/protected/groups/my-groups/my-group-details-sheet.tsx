'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { GlobeIcon, Info, Link, Tag, User, Pencil, Check, X } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import MyGroupsMembersTable from './my-groups-members-table'
import { Card } from '@repo/ui/cardpanel'
import DeleteGroupDialog from './dialogs/delete-group-dialog'
import AddMembersDialog from './dialogs/add-members-dialog'
import AssignPermissionsDialog from './dialogs/assign-permissions-dialog'
import MyGroupsPermissionsTable from './my-groups-permissions-table'
import InheritPermissionDialog from './dialogs/inherit-permission-dialog'
import { useGetGroupDetailsQuery, useUpdateGroupMutation, GroupSettingVisibility } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import { useToast } from '@repo/ui/use-toast'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { Input } from '@repo/ui/input'

const EditGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  visibility: z.enum(['Public', 'Private']),
  tags: z.array(z.object({ value: z.string(), label: z.string() })),
})

type EditGroupFormData = z.infer<typeof EditGroupSchema>

const GroupDetailsSheet = () => {
  const [activeTab, setActiveTab] = useState<'Members' | 'Permissions'>('Members')
  const [isEditing, setIsEditing] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedGroup, setSelectedGroup } = useMyGroupsStore()
  const { toast } = useToast()

  const [{ data, fetching }] = useGetGroupDetailsQuery({
    variables: { groupId: selectedGroup || '' },
    pause: !selectedGroup,
  })
  const { name, description, members, setting, tags, id, isManaged } = data?.group || {}

  const [{}, updateGroup] = useUpdateGroupMutation()

  const { control, handleSubmit, reset, setValue } = useForm<EditGroupFormData>({
    resolver: zodResolver(EditGroupSchema),
    defaultValues: {
      groupName: name || '',
      description: description || '',
      visibility: setting?.visibility === GroupSettingVisibility.PUBLIC ? 'Public' : 'Private',
      tags: tags?.map((tag) => ({ value: tag, label: tag })) || [],
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        groupName: name || '',
        description: description || '',
        visibility: setting?.visibility === GroupSettingVisibility.PUBLIC ? 'Public' : 'Private',
        tags: tags?.map((tag) => ({ value: tag, label: tag })) || [],
      })
    }
  }, [data, reset, name, description, setting, tags])

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
      toast({ title: 'Group updated successfully!', variant: 'success' })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating group:', error)
      toast({ title: 'Failed to update group.', variant: 'destructive' })
    }
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
                  <Button disabled={!!isManaged} icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(true)}>
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
                <div className="mt-7">{activeTab === 'Members' ? <MyGroupsMembersTable /> : <MyGroupsPermissionsTable />}</div>
              </div>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default GroupDetailsSheet
