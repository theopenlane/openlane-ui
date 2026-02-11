'use client'

import { useGetProgramBasicInfo, useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { Card } from '@repo/ui/cardpanel'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, Controller, FormProvider, Path, FieldValues, UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { Textarea } from '@repo/ui/textarea'
import { Pencil } from 'lucide-react'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { useGetOrgMemberships, useUserSelect } from '@/lib/graphql-hooks/members'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Label } from '@repo/ui/label'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  programOwnerId: z.string().optional(),
  frameworkName: z.string().optional(),
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

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.PROGRAM),
      field: 'kind',
    },
  })

  const { data: permission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const isEditAllowed = canEdit(permission?.roles)

  const [isEditing, setIsEditing] = useState(false)
  const [tagValues, setTagValues] = useState<{ value: string; label: string }[]>([])

  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const { standardOptions } = useStandardsSelect({})
  const standardOptionsNormalized = standardOptions.map((s) => ({ label: s.label, value: s.value }))
  const { tagOptions } = useGetTags()

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
        frameworkName: program?.frameworkName ?? '',
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
          frameworkName: values.frameworkName,
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 ">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Basic information</h2>
            {!isEditing && isEditAllowed && (
              <Button
                disabled={program?.status === ProgramProgramStatus.ARCHIVED}
                className="h-8! p-2!"
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
                <SaveButton disabled={isPending} />
                <CancelButton onClick={handleCancel}></CancelButton>
              </div>
            )}
          </div>
          {/* Name */}
          <div className="flex flex-col border-b pb-3 w-full">
            <div className="flex items-center">
              <Label className="block w-32 shrink-0">Name</Label>
              <div className="flex flex-col w-full">
                {isEditing ? <Controller name="name" control={form.control} render={({ field }) => <Input {...field} className="w-full" />} /> : <span>{program?.name || '—'}</span>}
                {form.formState.errors.name && <p className="text-destructive ">{form.formState.errors.name.message}</p>}
              </div>
            </div>
          </div>
          {/* Type */}
          <div className="flex border-b pb-3 items-center">
            <Label className="block w-32 shrink-0">Type</Label>
            <CustomTypeEnumValue value={program?.programKindName || ''} options={enumOptions ?? []} placeholder="-" />
          </div>
          {/* Framework */}
          <FrameworkField form={form} program={program} isEditing={isEditing} isEditAllowed={isEditAllowed} standardOptionsNormalized={standardOptionsNormalized} name="frameworkName" /> {/* Tags */}
          {(isEditing || (program?.tags && program.tags.length > 0)) && (
            <div className="flex border-b pb-3 items-center">
              <Label className="block w-32 shrink-0">Tags</Label>
              <div className="text-sm text-left flex gap-2 w-full">
                {isEditing ? (
                  <Controller
                    name="tags"
                    control={form.control}
                    render={({ field }) => (
                      <MultipleSelector
                        options={tagOptions}
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
                  program?.tags?.map((tag, i) => <TagChip key={i} tag={tag} />)
                )}
              </div>
            </div>
          )}
          {/* Description */}
          <div className="flex border-b pb-3 items-center">
            <Label className="block w-32 shrink-0">Description</Label>
            <div className="flex-1">
              <Controller
                name="description"
                control={form.control}
                render={({ field }) =>
                  isEditing ? (
                    <Textarea {...field} value={field.value ?? ''} placeholder="Add a description..." />
                  ) : (
                    <p className={`${!program?.description && 'text-neutral-400!'}`}>{program?.description || '—'}</p>
                  )
                }
              />
            </div>
          </div>
          {/* Program Owner */}
          <div className="flex pb-3 items-center">
            <Label className="block w-32 shrink-0">Program Owner</Label>
            <div className="flex-1">
              <Controller
                name="programOwnerId"
                control={form.control}
                render={({ field }) =>
                  isEditing ? (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="">{userOptions.find((u) => u.value === field.value)?.label || 'Select owner'}</SelectTrigger>
                      <SelectContent>
                        {userOptions.map((user) => (
                          <SelectItem key={user.value} value={user.value}>
                            {user.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className={`${!programOwnerDisplayName && 'text-neutral-400!'}`}>{programOwnerDisplayName || '—'}</p>
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

interface FrameworkFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  program?: { frameworkName?: string | null }
  isEditing: boolean
  isEditAllowed: boolean
  standardOptionsNormalized: Option[]
  name: Path<T>
}

export function FrameworkField<T extends FieldValues>({ form, program, isEditing, isEditAllowed, standardOptionsNormalized, name }: FrameworkFieldProps<T>) {
  const [query, setQuery] = useState(program?.frameworkName || '')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = standardOptionsNormalized.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()))
  useEffect(() => {
    setQuery(program?.frameworkName || '')
  }, [isEditing, program])

  return (
    <div className="flex border-b pb-3 items-center relative">
      <Label className="block w-32 shrink-0">Framework</Label>
      <div className="flex-1 relative">
        <Controller
          name={name}
          control={form.control}
          render={({ field }) => {
            const isEditable = isEditing && isEditAllowed
            const value = field.value || ''

            return isEditable ? (
              <div className="relative ">
                <Input
                  value={query || value}
                  onChange={(e) => {
                    const val = e.target.value
                    setQuery(val)
                    setShowSuggestions(true)
                    field.onChange(val)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // allow click before closing
                  placeholder="Enter framework name"
                />

                {showSuggestions && filteredSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover p-1 shadow-md">
                    {filteredSuggestions.map((opt) => (
                      <li
                        key={opt.value}
                        onMouseDown={() => {
                          field.onChange(opt.label)
                          setQuery(opt.label)
                          setShowSuggestions(false)
                        }}
                        className="cursor-pointer rounded-sm px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className={`${!program?.frameworkName && 'text-neutral-400!'}`}>{program?.frameworkName || '—'}</p>
            )
          }}
        />
      </div>
    </div>
  )
}
