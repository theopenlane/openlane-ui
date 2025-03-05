'use client'
import React, { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { GroupSettingVisibility } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import MultipleSelector from '@repo/ui/multiple-selector'
import { useCreateGroupWithMembers } from '@/lib/graphql-hooks/groups'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'

const CreateGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  members: z.array(z.string()),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['Public', 'Private']),
})

type CreateGroupFormData = z.infer<typeof CreateGroupSchema>

type MyGroupsDialogProps = {
  triggerText?: boolean
}

const CreateGroupDialog = ({ triggerText }: MyGroupsDialogProps) => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public')
  const { mutateAsync: createGroup } = useCreateGroupWithMembers()
  const { successNotification, errorNotification } = useNotification()

  const { data: membersData } = useGetSingleOrganizationMembers(session?.user.activeOrganizationId)
  const membersOptions = membersData?.organization?.members
    ?.filter((member) => member.user.id !== session?.user.userId)
    .map((member) => ({
      value: member.user.id,
      label: `${member.user.firstName} ${member.user.lastName}`,
    }))

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: {
      groupName: '',
      description: '',
      tags: [],
      visibility: 'Public',
      members: [],
    },
  })

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
        members: data.members.map((memberId) => ({
          userID: memberId,
        })),
      })

      successNotification({ title: 'Group created successfully!' })
      setIsOpen(false)
      reset()
    } catch (error) {
      console.error('Error creating group:', error)
      errorNotification({ title: 'Failed to create group' })
    }
  }

  const handleVisibilityChange = (value: 'Public' | 'Private') => {
    setVisibility(value)
    setValue('visibility', value, { shouldValidate: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerText ? (
          <div className="flex cursor-pointer">
            <p className="text-brand ">Create a new one</p>
            <p>?</p>
          </div>
        ) : (
          <Button icon={<PlusCircle />} iconPosition="left">
            Create Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create a new group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="groupName">
              Group name:
            </Label>
            <Input id="groupName" placeholder="Group name" {...register('groupName')} />
            {errors.groupName && <p className="text-red-500 text-sm">{errors.groupName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="members">
              Assign member(s) to the group:
            </Label>
            <MultipleSelector
              defaultOptions={membersOptions}
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
