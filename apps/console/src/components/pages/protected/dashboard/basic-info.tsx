'use client'

import { useGetProgramBasicInfo, useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { Card } from '@repo/ui/cardpanel'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Textarea } from '@repo/ui/textarea'
import { Pencil } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { ProgramTypeLabels } from '@/components/shared/enum-mapper/program-enum'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { useGetOrgMemberships, useUserSelect } from '@/lib/graphql-hooks/members'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  programOwnerId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const BasicInformation = () => {
  const { id } = useParams<{ id: string }>()
  const { data } = useGetProgramBasicInfo(id)
  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()
  const { data: programOwner } = useGetOrgMemberships({ where: { userID: data?.program.programOwnerID }, enabled: !!data?.program.programOwnerID })
  const { userOptions } = useUserSelect({})
  const programOwnerDisplayName = programOwner?.orgMemberships.edges?.[0]?.node?.user.displayName
  const program = data?.program

  const [isEditing, setIsEditing] = useState(false)
  const [tagValues, setTagValues] = useState<{ value: string; label: string }[]>([])

  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: program?.name ?? '',
      description: program?.description ?? '',
      tags: program?.tags ?? [],
    },
  })

  useEffect(() => {
    if (program) {
      form.reset({
        name: program.name ?? '',
        description: program.description ?? '',
        tags: program.tags ?? [],
        programOwnerId: program.programOwnerID ?? '',
      })

      setTagValues(
        (program.tags ?? []).map((tag) => ({
          label: tag,
          value: tag,
        })),
      )
    }
  }, [program, form])

  const handleCancel = () => {
    if (program) {
      form.reset({
        name: program.name ?? '',
        description: program.description ?? '',
        tags: program.tags ?? [],
      })

      setTagValues(
        (program.tags ?? []).map((tag) => ({
          label: tag,
          value: tag,
        })),
      )
    }

    setIsEditing(false)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProgram({
        updateProgramId: id,
        input: {
          name: values.name,
          description: values.description ?? null,
          tags: values.tags ?? [],
          programOwnerID: values.programOwnerId || undefined,
        },
      })

      successNotification({
        title: 'Program updated',
        description: 'Basic information updated successfully.',
      })

      queryClient.invalidateQueries({ queryKey: ['programs', id] })
      setIsEditing(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Card className="p-8 flex-1">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Basic information</h2>
            {!isEditing && (
              <Button
                disabled={program?.status === ProgramProgramStatus.ARCHIVED}
                className="!h-8 !p-2"
                variant="secondary"
                type="button"
                icon={<Pencil />}
                iconPosition="left"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button className="!h-8 !p-2" variant="secondary" type="submit" icon={<Pencil />} iconPosition="left" disabled={isPending}>
                  Save
                </Button>
                <Button type="button" variant="back" className="!h-8 !p-2" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col border-b pb-2.5 w-full">
            <div className="flex items-start">
              <span className="block w-32 shrink-0">Name</span>
              <div className="flex flex-col">
                {isEditing ? <Controller name="name" control={form.control} render={({ field }) => <Input {...field} className="w-full" />} /> : <span>{program?.name || '—'}</span>}
                {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="flex border-b pb-2.5">
            <span className="block w-32 shrink-0">Type</span>
            {program?.programType && <span>{ProgramTypeLabels[program.programType] || '-'}</span>}
          </div>

          {/* Framework */}
          {program?.frameworkName && (
            <div className="flex border-b pb-2.5">
              <span className="block w-32 shrink-0">Framework</span>
              <span>{program.frameworkName}</span>
            </div>
          )}

          {/* Tags */}
          {(isEditing || (program?.tags && program.tags.length > 0)) && (
            <div className="flex border-b pb-2.5">
              <span className="block w-32 shrink-0">Tags</span>
              <div className="text-sm text-left w-full">
                {isEditing ? (
                  <Controller
                    name="tags"
                    control={form.control}
                    render={({ field }) => (
                      <MultipleSelector
                        placeholder="Add tag..."
                        creatable
                        className="w-full"
                        commandProps={{ className: 'w-full' }}
                        value={tagValues}
                        onChange={(selected) => {
                          const values = selected.map((s) => s.value)
                          field.onChange(values)
                          setTagValues(selected)
                        }}
                      />
                    )}
                  />
                ) : (
                  program?.tags?.map((tag, i) => (
                    <Badge key={i} variant={'outline'}>
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="flex border-b pb-2.5">
            <span className="block w-32 shrink-0">Description</span>
            <div className="flex-1">
              <Controller
                name="description"
                control={form.control}
                render={({ field }) =>
                  isEditing ? (
                    <Textarea {...field} value={field.value ?? ''} placeholder="Add a description..." />
                  ) : (
                    <p className={`${!program?.description && '!text-neutral-400'}`}>{program?.description || '—'}</p>
                  )
                }
              />
            </div>
          </div>
          {/* Program Owner */}
          <div className="flex pb-2.5">
            <span className="block w-32 shrink-0">Program Owner</span>
            <div className="flex-1">
              <Controller
                name="programOwnerId"
                control={form.control}
                render={({ field }) =>
                  isEditing ? (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-[250px]">{userOptions.find((u) => u.value === field.value)?.label || 'Select owner'}</SelectTrigger>
                      <SelectContent>
                        {userOptions.map((user) => (
                          <SelectItem key={user.value} value={user.value}>
                            {user.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className={`${!programOwnerDisplayName && '!text-neutral-400'}`}>{programOwnerDisplayName || '—'}</p>
                  )
                }
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </Card>
  )
}

export default BasicInformation
