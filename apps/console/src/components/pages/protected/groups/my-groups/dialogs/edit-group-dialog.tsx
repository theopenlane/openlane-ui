'use client'
import React, { useEffect, useState } from 'react'
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
import { useUpdateGroupMutation } from '@repo/codegen/src/schema'
import { Pencil } from 'lucide-react'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'

const EditGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  tags: z.string().optional(), // Tags should be a single comma-separated string for easier input handling
  visibility: z.enum(['Public', 'Private']),
})

type EditGroupFormData = z.infer<typeof EditGroupSchema>

const EditGroupDialog = () => {
  const { selectedGroup } = useMyGroupsStore()

  const [isOpen, setIsOpen] = useState(false)
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Private')
  const { toast } = useToast()

  const [{}, updateGroup] = useUpdateGroupMutation()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<EditGroupFormData>({
    resolver: zodResolver(EditGroupSchema),
    defaultValues: {
      groupName: '',
      description: '',
      tags: '',
      visibility: 'Public',
    },
  })

  // Prefill form when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      setValue('groupName', selectedGroup.name)
      setValue('description', selectedGroup.description || '')
      setValue('tags', selectedGroup.tags?.join(', ') || '') // Convert array to comma-separated string
      setValue('visibility', selectedGroup.visibility === 'PUBLIC' ? 'Public' : 'Private')
      setVisibility(selectedGroup.visibility === 'PUBLIC' ? 'Public' : 'Private')
    }
  }, [selectedGroup, setValue])

  const onSubmit = async (data: EditGroupFormData) => {
    if (!selectedGroup) return

    console.log('Updating group:', { id: selectedGroup.id, ...data })
    toast({ title: 'Group updated successfully!', variant: 'success' })
    setIsOpen(false)
    reset()

    try {
      //   await updateGroup({
      //     input: {
      //       id: selectedGroup.id,
      //       name: data.groupName,
      //       description: data.description,
      //       tags: data?.tags?.split(',').map((tag) => tag.trim()), // Convert back to an array
      //       visibility: data.visibility === 'Public' ? 'PUBLIC' : 'PRIVATE',
      //     },
      //   })
      toast({ title: 'Group updated successfully!', variant: 'success' })
    } catch (error) {
      console.error('Error updating group:', error)
      toast({ title: 'Failed to update group.', variant: 'destructive' })
    }
  }

  const handleVisibilityChange = (value: 'Public' | 'Private') => {
    setVisibility(value)
    setValue('visibility', value, { shouldValidate: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Pencil />} iconPosition="left" variant="outline" disabled={!selectedGroup}>
          Edit Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Edit Group</DialogTitle>
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditGroupDialog
