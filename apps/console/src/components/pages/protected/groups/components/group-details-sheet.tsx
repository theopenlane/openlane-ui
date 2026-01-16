'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { GlobeIcon, Info, Link, Tag, User, Pencil, PanelRightClose } from 'lucide-react'
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
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { canEdit } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { PLATFORM_DOCS_URL } from '@/constants/docs'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

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
  const { selectedGroup, setSelectedGroup, setIsAdmin } = useGroupsStore()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { replace } = useSmartRouter()
  const { data: permission } = useAccountRoles(ObjectEnum.GROUP, selectedGroup)
  const { tagOptions } = useGetTags()

  const { data, isPending: fetching } = useGetGroupDetails(selectedGroup)

  const { name, displayName, description, members, setting, tags, id, isManaged } = data?.group || {}

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
    replace({ id: null })
  }
  const onSubmit = async (data: EditGroupFormData) => {
    if (!selectedGroup || !id) return

    try {
      await updateGroup({
        updateGroupId: id,
        input: {
          name: data.groupName,
          displayName: data.groupName,
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
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    if (data) {
      reset({
        groupName: displayName || name || '',
        description: description || '',
        visibility: setting?.visibility === GroupSettingVisibility.PUBLIC ? 'Public' : 'Private',
        tags: tags?.map((tag) => ({ value: tag, label: tag })) || [],
      })
      const userRole = data.group.members?.edges?.find((membership) => membership?.node?.user.id === sessionData?.user.userId)?.node?.role
      if (userRole) {
        setIsAdmin(userRole === GroupMembershipRole.ADMIN)
      }
    }
  }, [data, reset, name, displayName, description, setting, tags, sessionData?.user.userId, setIsAdmin])

  useEffect(() => {
    const groupId = searchParams.get('id')
    if (groupId) {
      setSelectedGroup(groupId)
    }
  }, [searchParams, setSelectedGroup])

  return (
    <Sheet open={!!selectedGroup} onOpenChange={handleSheetClose}>
      <SheetContent
        className="flex flex-col"
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={handleSheetClose} />

              <div className="flex justify-end gap-2">
                <Button icon={<Link />} iconPosition="left" variant="secondary" onClick={handleCopyLink}>
                  Copy link
                </Button>
                {isEditing ? (
                  <div className="flex gap-2">
                    <CancelButton onClick={() => setIsEditing(false)}></CancelButton>
                    <SaveButton onClick={handleSubmit(onSubmit)} />
                  </div>
                ) : (
                  <Button disabled={!!isManaged || !canEdit(permission?.roles)} icon={<Pencil />} iconPosition="left" variant="secondary" onClick={() => setIsEditing(true)}>
                    Edit Group
                  </Button>
                )}

                <DeleteGroupDialog />
              </div>
            </div>
          </SheetHeader>
        }
      >
        {fetching ? (
          <Loading />
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)}>
              <SheetTitle>{isEditing ? <Controller name="groupName" control={control} render={({ field }) => <Input {...field} placeholder="Group name" />} /> : displayName || name}</SheetTitle>
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
                    <p className="text-sm">{members?.edges?.length}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Tag height={16} width={16} color="#2CCBAB" />
                    <p className="text-sm">Tags:</p>
                    {isEditing ? (
                      <Controller name="tags" control={control} render={({ field }) => <MultipleSelector value={field.value} creatable options={tagOptions} onChange={field.onChange} />} />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags?.map((tag: string, i: number) => (
                          <TagChip key={i} tag={tag} />
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
                      <a href={`${PLATFORM_DOCS_URL}/basics/groups/permissions`} target="_blank" rel="noreferrer" className="text-brand hover:underline">
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
