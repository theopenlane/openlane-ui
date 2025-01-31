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
import { useToast } from '@repo/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { GetSingleOrganizationMembersQueryVariables, useCreateGroupMutation, useGetInvitesQuery, useGetSingleOrganizationMembersQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import MultipleSelector from '@repo/ui/multiple-selector'
import { mutate } from 'swr'

const CreateGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  members: z.array(z.string()).min(1, 'At least one member must be selected'),
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
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Private')
  const { toast } = useToast()

  const [{}, createGroup] = useCreateGroupMutation()

  const variables: GetSingleOrganizationMembersQueryVariables = {
    organizationId: session?.user.activeOrganizationId ?? '',
  }

  const [{ data: membersData }] = useGetSingleOrganizationMembersQuery({
    variables,
  })

  const membersOptions = membersData?.organization?.members?.map((member) => ({
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
      visibility: 'Public',
    },
  })

  const onSubmit = async (data: CreateGroupFormData) => {
    console.log(data)
    toast({ title: 'Group created successfully!', variant: 'success' })
    setIsOpen(false)
    reset()
    try {
      await createGroup({
        input: {
          name: data.groupName,
          userIDs: data.members,
          description: data.description,
          tags: data.tags,
        },
      })
      toast({ title: 'Group created successfully!', variant: 'success' })
    } catch (error) {}
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
            {membersOptions && <MultipleSelector defaultOptions={membersOptions} />}
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
            <Input id="tags" placeholder="Choose existing or add tag..." {...register('tags')} />
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
