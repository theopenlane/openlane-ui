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
import { useUpdateGroupMutation, GroupSettingVisibility, useGetGroupDetailsQuery } from '@repo/codegen/src/schema'
import { Pencil } from 'lucide-react'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'
import MultipleSelector from '@repo/ui/multiple-selector'

const EditGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  visibility: z.enum(['Public', 'Private']),
})

type EditGroupFormData = z.infer<typeof EditGroupSchema>

const EditGroupDialog = () => {
  const { selectedGroup } = useMyGroupsStore()
  const [newtags, setNewTags] = useState<{ value: string; label: string }[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Private')
  const { toast } = useToast()

  const [{ data, fetching }] = useGetGroupDetailsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const { id, name, tags, description, setting, isManaged } = data?.group || {}

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
      visibility: 'Public',
    },
  })

  useEffect(() => {
    if (data) {
      setValue('groupName', name || '')
      setValue('description', description || '')
      setValue('visibility', setting?.visibility === 'PUBLIC' ? 'Public' : 'Private')
      setVisibility(setting?.visibility === 'PUBLIC' ? 'Public' : 'Private')
      setNewTags(tags?.map((tag) => ({ value: tag, label: tag })) || [])
    }
  }, [data])

  const onSubmit = async (data: EditGroupFormData) => {
    if (!selectedGroup || !id) return

    try {
      await updateGroup({
        updateGroupId: id,
        input: {
          name: data.groupName,
          description: data.description,
          tags: newtags.map((t) => t.value),
          updateGroupSettings: {
            visibility: data.visibility === 'Public' ? GroupSettingVisibility.PUBLIC : GroupSettingVisibility.PRIVATE,
          },
        },
      })
      toast({ title: 'Group updated successfully!', variant: 'success' })
      setIsOpen(false)
      reset()
    } catch (error) {
      console.error('Error updating group:', error)
      toast({ title: 'Failed to update group.', variant: 'destructive' })
    }
  }

  const handleVisibilityChange = (value: 'Public' | 'Private') => {
    setVisibility(value)
    setValue('visibility', value, { shouldValidate: true })
  }

  if (!selectedGroup) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Pencil />} iconPosition="left" variant="outline" disabled={!!isManaged}>
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
            <MultipleSelector
              value={newtags} // ✅ Controlled by state
              creatable
              defaultOptions={newtags} // ✅ Preloaded tags
              onChange={(selected) => setNewTags(selected)} // ✅ Update state directly
            />
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
