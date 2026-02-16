'use client'
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { GroupMembershipRole, GroupSettingVisibility } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { useCreateGroupWithMembers } from '@/lib/graphql-hooks/group'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

const CreateGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  admins: z.array(z.string()).optional(),
  members: z.array(z.string()),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['Public', 'Private']),
})

type CreateGroupFormData = z.infer<typeof CreateGroupSchema>

type MyGroupsDialogProps = {
  trigger?: React.ReactElement
}

const CreateGroupDialog = ({ trigger }: MyGroupsDialogProps) => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public')
  const { mutateAsync: createGroup } = useCreateGroupWithMembers()
  const { successNotification, errorNotification } = useNotification()
  const [adminValues, setAdminValues] = useState<{ value: string; label: string }[]>([])
  const { tagOptions } = useGetTags()

  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const membersOptions = membersData?.organization?.members?.edges?.map((member) => ({
    value: member?.node?.user?.id,
    label: `${member?.node?.user?.displayName}`,
  }))

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
    reset,
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: {
      groupName: '',
      description: '',
      tags: [],
      visibility: 'Public',
      admins: adminValues.map((admin) => admin.value),
      members: [],
    },
  })

  useEffect(() => {
    if (session?.user?.userId) {
      const initialAdmin = [{ value: session.user.userId, label: 'You' }]
      setAdminValues(initialAdmin)
      setValue(
        'admins',
        initialAdmin.map((admin) => admin.value),
        { shouldValidate: true },
      )
    }
  }, [session, setValue])

  const onSubmit = async (data: CreateGroupFormData) => {
    try {
      await createGroup({
        groupInput: {
          name: data.groupName,
          description: data.description,
          tags: data.tags,
          createGroupSettings: {
            visibility: data.visibility === 'Public' ? GroupSettingVisibility.PUBLIC : GroupSettingVisibility.PRIVATE,
          },
        },
        members: [
          ...(data.admins?.map((adminId) => ({
            userID: adminId,
            role: GroupMembershipRole.ADMIN,
          })) || []),
          ...data.members.map((memberId) => ({
            userID: memberId,
            role: GroupMembershipRole.MEMBER,
          })),
        ],
      })

      successNotification({ title: 'Group created successfully!' })
      setIsOpen(false)
      reset()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleVisibilityChange = (value: 'Public' | 'Private') => {
    setVisibility(value)
    setValue('visibility', value, { shouldValidate: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger className="bg-transparent px-1">{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button icon={<PlusCircle />} iconPosition="left">
            Create Group
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create a new group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="groupName">
              Group name:
            </Label>
            <Controller name="groupName" control={control} render={({ field }) => <Input placeholder="Group name" {...field} />} />
            {errors.groupName && <p className="text-red-500 text-sm">{errors.groupName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="members">
              Add admins(s):
            </Label>
            <MultipleSelector
              defaultOptions={membersOptions as Option[]}
              value={adminValues}
              onChange={(selected) =>
                setValue(
                  'admins',
                  selected.map((s) => s.value),
                  { shouldValidate: true },
                )
              }
            />
            {errors.admins && <p className="text-red-500 text-sm">{errors.admins.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="members">
              Add member(s):
            </Label>
            <MultipleSelector
              defaultOptions={membersOptions as Option[]}
              onChange={(selected) =>
                setValue(
                  'members',
                  selected.map((s) => s.value),
                  { shouldValidate: true },
                )
              }
            />
            {errors.members && <p className="text-red-500 text-sm">{errors.members.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="description">
              Description:
            </Label>
            <Textarea id="description" placeholder="Add a description" {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="tags">
              Tags:
            </Label>
            <MultipleSelector
              creatable
              options={tagOptions}
              onChange={(selected) =>
                setValue(
                  'tags',
                  selected.map((s) => s.value),
                  { shouldValidate: true },
                )
              }
            />
            {errors.tags && <p className="text-red-500 text-sm">{errors.tags.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Visibility:</Label>
            <Select value={visibility} onValueChange={handleVisibilityChange}>
              <SelectTrigger>{visibility}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
              </SelectContent>
            </Select>
            {errors.visibility && <p className="text-red-500 text-sm">{errors.visibility.message}</p>}
          </div>

          <DialogFooter>
            <Button className="w-full mt-4" type="submit">
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateGroupDialog
