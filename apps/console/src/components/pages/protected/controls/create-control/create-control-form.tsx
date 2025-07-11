'use client'

import { useForm, Controller, FormProvider, UseFormReturn } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor'
import AuthorityCard from '@/components/pages/protected/controls/authority-card'
import PropertiesCard from '@/components/pages/protected/controls/properties-card'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlFormData, createControlFormSchema } from './use-form-schema'
import { ControlControlStatus, CreateControlImplementationInput, CreateControlInput, CreateControlObjectiveInput, CreateSubcontrolInput } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useControlSelect, useCreateControl, useGetControlById } from '@/lib/graphql-hooks/controls'
import { useNotification } from '@/hooks/useNotification'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Popover, PopoverContent } from '@repo/ui/popover'
import { Command, CommandItem, CommandList, CommandEmpty } from '@repo/ui/command'
import { PopoverTrigger } from '@radix-ui/react-popover'
import useClickOutside from '@/hooks/useClickOutside'
import { Option } from '@repo/ui/multiple-selector'
import { useCreateSubcontrol } from '@/lib/graphql-hooks/subcontrol'
import { Check } from 'lucide-react'
import { BreadcrumbContext, Crumb } from '@/providers/BreadcrumbContext.tsx'
import { useCreateControlImplementation } from '@/lib/graphql-hooks/control-implementations'
import { useCreateControlObjective } from '@/lib/graphql-hooks/control-objectives'

export default function CreateControlForm() {
  const { id } = useParams<{ id: string | undefined }>()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const path = usePathname()
  const isCreateSubcontrol = path.includes('/create-subcontrol')
  const [createMultiple, setCreateMultiple] = useState(false)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedParentControlLabel, setSelectedParentControlLabel] = useState('')
  const [dataInitialized, setDataInitialized] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)
  const [createObjective, setCreateObjective] = useState(false)
  const [createImplementation, setCreateImplementation] = useState(false)

  const { mutateAsync: createControlImplementation } = useCreateControlImplementation()
  const { mutateAsync: createControlObjective } = useCreateControlObjective()

  const dropdownRef = useClickOutside(() => setOpen(false))
  const searchRef = useRef(null)

  const form = useForm<ControlFormData>({
    resolver: zodResolver(createControlFormSchema(isCreateSubcontrol)),
    defaultValues: {
      status: ControlControlStatus.NOT_IMPLEMENTED,
      category: '',
      subcategory: '',
    },
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const { data: controlData, isLoading } = useGetControlById(id)

  const { data, controlOptions } = useControlSelect({
    where: search ? { refCodeContainsFold: search } : undefined,
  })

  const { mutateAsync: createControl } = useCreateControl()
  const { mutateAsync: createSubcontrol } = useCreateSubcontrol()

  const { convertToHtml } = usePlateEditor()

  const resetForm = () => {
    setClearData(true)
    const controlID = form.getValues('controlID')
    reset({ controlID })
  }
  const onSubmit = async (formData: ControlFormData) => {
    const { desiredOutcome, details, ...data } = formData
    try {
      const description = await convertToHtml(data.description)

      let newId: string | undefined

      const commonInput = {
        ...data,
        description,
        referenceID: data.referenceID || undefined,
        auditorReferenceID: data.auditorReferenceID || undefined,
      }

      if (isCreateSubcontrol) {
        const response = await createSubcontrol({ input: commonInput as CreateSubcontrolInput })
        newId = response?.createSubcontrol?.subcontrol?.id
      } else {
        const response = await createControl({ input: commonInput as CreateControlInput })
        newId = response?.createControl?.control?.id
      }

      if (desiredOutcome && createObjective) {
        const controlObjectiveOutcome = await convertToHtml(desiredOutcome as ControlFormData['desiredOutcome'])

        const payload: CreateControlObjectiveInput = {
          name: `${data.refCode} Objective`,
          desiredOutcome: controlObjectiveOutcome,
          ...(isCreateSubcontrol ? { subcontrolIDs: [newId] } : { controlIDs: [newId] }),
          category: data.category,
        }

        await createControlObjective(payload)
      }

      if (details && createImplementation) {
        const controlImplementationDetails = await convertToHtml(details as ControlFormData['details'])
        const payload: CreateControlImplementationInput = {
          details: controlImplementationDetails,
          implementationDate: new Date().toISOString(),
          ...(isCreateSubcontrol ? { subcontrolIDs: [newId] } : { controlIDs: [newId] }),
        }
        await createControlImplementation(payload)
      }

      if (createMultiple) {
        resetForm()
        successNotification({ title: 'Control created successfully' })
      } else if (newId && isCreateSubcontrol) {
        successNotification({ title: 'Control created successfully, redirecting...' })
        router.push(`/controls/${form.getValues('controlID')}/${newId}`)
      } else if (newId) {
        successNotification({ title: 'Control created successfully, redirecting...' })
        router.push(`/controls/${newId}`)
      }
    } catch {
      errorNotification({
        title: 'Failed to create control',
        description: 'Something went wrong. Please try again.',
      })
    }
  }

  const fillCategoryAndSubcategory = useCallback((form: UseFormReturn<ControlFormData>, node?: { category?: string | null; subcategory?: string | null }) => {
    if (!node) return

    const currentCategory = form.getValues('category')
    const currentSubcategory = form.getValues('subcategory')

    if (!currentCategory && node.category) {
      form.setValue('category', node.category)
    }
    if (!currentSubcategory && node.subcategory) {
      form.setValue('subcategory', node.subcategory)
    }
  }, [])

  const handleControlSelect = (opt: Option) => {
    setSelectedParentControlLabel(opt.label)
    setSearch(opt.label)
    setOpen(false)
    form.setValue('controlID', opt.value)

    const selectedNode = data?.controls?.edges?.find((edge) => edge?.node?.id === opt.value)?.node
    if (selectedNode) {
      fillCategoryAndSubcategory(form, selectedNode)
    }
  }

  useEffect(() => {
    const crumbs: Crumb[] = [
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
    ]
    if (id) {
      crumbs.push({ label: controlData?.control?.refCode, isLoading, href: `/controls/${controlData?.control.id}` })
    }
    const lastCrumb = isCreateSubcontrol ? { label: 'Create Subcontrol' } : { label: 'Create Subcontrol' }
    crumbs.push(lastCrumb)
    setCrumbs(crumbs)
  }, [setCrumbs, controlData, isLoading, isCreateSubcontrol, id])

  useEffect(() => {
    if (controlData?.control && !dataInitialized) {
      const label = `${controlData.control.refCode} ${controlData.control?.referenceFramework ? `(${controlData.control?.referenceFramework.trim()})` : '(CUSTOM)'}`
      fillCategoryAndSubcategory(form, controlData.control)
      setSearch(label)
      setSelectedParentControlLabel(label)
      form.setValue('controlID', controlData?.control.id)
      setDataInitialized(true)
    }
  }, [controlData, form, fillCategoryAndSubcategory, selectedParentControlLabel, dataInitialized])

  const onCancel = () => {
    setClearData(true)
    reset()
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-2xl font-semibold">{isCreateSubcontrol ? 'Create Subcontrol' : 'Create Control'}</div>

        <div className="flex gap-12">
          <div className="flex-1">
            {/* Name */}
            <div>
              <Label>
                Name <span className="text-destructive">*</span>
              </Label>
              {errors?.refCode && <p className="text-destructive text-sm mt-1">{errors.refCode.message}</p>}
              <Input {...register('refCode', { required: true })} />
            </div>

            {isCreateSubcontrol && (
              <div className=" mt-4">
                <Label>
                  Parent Control <span className="text-destructive">*</span>
                </Label>
                <div ref={dropdownRef} className="relative w-full">
                  <Input
                    ref={searchRef}
                    role="combobox"
                    value={search}
                    placeholder="Search Control"
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setOpen(false)
                    }}
                  />
                  {errors?.controlID && <p className="text-destructive text-sm mt-1">Parent Control is required</p>}

                  <Popover open={open}>
                    <PopoverTrigger className="h-0 absolute" />
                    <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} align="start" className="absolute z-50  w-[334px] p-0">
                      <Command shouldFilter={false}>
                        <CommandList>
                          <CommandEmpty>No results.</CommandEmpty>
                          <CommandItem onSelect={() => setSearch(selectedParentControlLabel)}>
                            <div className="flex gap-1 items-center opacity-50">
                              <Check size={12} />
                              <p>{selectedParentControlLabel}</p>
                            </div>
                          </CommandItem>
                          {controlOptions
                            .filter((opt) => opt.value !== form.getValues('controlID'))
                            .map((opt) => (
                              <CommandItem
                                className="pl-7"
                                key={opt.value}
                                value={opt.value}
                                onSelect={() => {
                                  handleControlSelect(opt)
                                }}
                              >
                                {opt.label}
                              </CommandItem>
                            ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-4">
              <Label>Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <PlateEditor variant="basic" initialValue={field.value as string} clearData={clearData} onClear={() => setClearData(false)} onChange={field.onChange} />}
              />
            </div>

            {/* Optional Creation: Control Objective & Implementation */}
            <div className="mt-4 space-y-4">
              {/* Create Objective Checkbox */}
              <div className="flex items-center gap-2">
                <Switch checked={createObjective} onCheckedChange={setCreateObjective} />
                <Label>Create Control Objective</Label>
              </div>
              {createObjective && (
                <Controller
                  name="desiredOutcome"
                  control={control}
                  render={({ field }) => (
                    <PlateEditor
                      variant="basic"
                      initialValue={field.value as string}
                      clearData={clearData}
                      onClear={() => setClearData(false)}
                      onChange={field.onChange}
                      placeholder="Enter the control objective"
                    />
                  )}
                />
              )}

              {/* Create Implementation Checkbox */}
              <div className="flex items-center gap-2">
                <Switch checked={createImplementation} onCheckedChange={setCreateImplementation} />
                <Label>Create Control Implementation</Label>
              </div>
              {createImplementation && (
                <Controller
                  name="details"
                  control={control}
                  render={({ field }) => (
                    <PlateEditor
                      variant="basic"
                      initialValue={field.value as string}
                      clearData={clearData}
                      onClear={() => setClearData(false)}
                      onChange={field.onChange}
                      placeholder="Enter the implementation details"
                    />
                  )}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="back" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={createMultiple} onCheckedChange={setCreateMultiple} />
                <span>Create multiple</span>
              </div>
            </div>
          </div>

          {/* Authority & Properties Grid */}
          <div className="flex flex-col gap-5 min-w-[336px]">
            <AuthorityCard isEditing />
            <PropertiesCard isEditing />
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
