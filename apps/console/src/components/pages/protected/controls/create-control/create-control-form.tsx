'use client'

import { useForm, Controller, FormProvider, UseFormReturn } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor'
import PropertiesCard from '@/components/pages/protected/controls/properties-card'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlFormData, createControlFormSchema } from './use-form-schema'
import {
  Control,
  ControlControlSource,
  ControlControlStatus,
  CreateControlImplementationInput,
  CreateControlInput,
  CreateControlObjectiveInput,
  CreateMappedControlInput,
  CreateSubcontrolInput,
  MappedControlMappingSource,
  MappedControlMappingType,
  Subcontrol,
} from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useControlSelect, useCreateControl, useGetControlById, useGetControlDiscussionById, useGetControlMinifiedById } from '@/lib/graphql-hooks/controls'
import { useNotification } from '@/hooks/useNotification'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Popover, PopoverContent } from '@repo/ui/popover'
import { Command, CommandItem, CommandList, CommandEmpty } from '@repo/ui/command'
import { PopoverTrigger } from '@radix-ui/react-popover'
import useClickOutside from '@/hooks/useClickOutside'
import { Option } from '@repo/ui/multiple-selector'
import { useCreateSubcontrol, useGetSubcontrolMinifiedById } from '@/lib/graphql-hooks/subcontrol'
import { Check } from 'lucide-react'
import { BreadcrumbContext, Crumb } from '@/providers/BreadcrumbContext.tsx'
import { useCreateControlImplementation } from '@/lib/graphql-hooks/control-implementations'
import { useCreateControlObjective } from '@/lib/graphql-hooks/control-objectives'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { Loading } from '@/components/shared/loading/loading'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Card } from '@repo/ui/cardpanel'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import RelatedControls from './related-controls'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { Value } from 'platejs'

export default function CreateControlForm() {
  const params = useSearchParams()
  const mapControlId = params.get('mapControlId')
  const mapSubcontrolId = params.get('mapSubcontrolId')
  const { id } = useParams<{ id: string | undefined }>()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const path = usePathname()
  const isCreateSubcontrol = path.includes('/create-subcontrol')
  const isCloning = path.includes('/clone-control')
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
  const [mappedControls, setMappedControls] = useState<{ controls: Control[]; subcontrols: Subcontrol[] }>({ controls: [], subcontrols: [] })
  const { data: permission, isLoading: permissionsLoading } = useOrganizationRoles()
  const createAllowed = canCreate(permission?.roles, isCreateSubcontrol ? AccessEnum.CanCreateSubcontrol : AccessEnum.CanCreateControl)

  const [associations, setAssociations] = useState<TObjectAssociationMap>(() => ({}))
  const { mutateAsync: createControlImplementation } = useCreateControlImplementation()
  const { mutateAsync: createControlObjective } = useCreateControlObjective()
  const { mutateAsync: createMappedControl } = useCreateMappedControl()
  const { data: discussionData } = useGetControlDiscussionById(id ?? null)
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const dropdownRef = useClickOutside(() => setOpen(false))
  const searchRef = useRef(null)

  const initialValues = {
    status: ControlControlStatus.NOT_IMPLEMENTED,
    refCode: '',
  }

  const form = useForm<ControlFormData>({
    resolver: zodResolver(createControlFormSchema(isCreateSubcontrol)),
    defaultValues: initialValues,
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const { data: controlData, isLoading } = useGetControlById(id)

  const { data: mappedControlData } = useGetControlMinifiedById(mapControlId || '')
  const { data: mappedSubcontrolData } = useGetSubcontrolMinifiedById(mapSubcontrolId || '')

  const { data, controlOptions } = useControlSelect({
    where: search ? { refCodeContainsFold: search } : undefined,
  })

  const { mutateAsync: createControl } = useCreateControl()
  const { mutateAsync: createSubcontrol } = useCreateSubcontrol()

  const { convertToHtml } = usePlateEditor()

  const resetAllExcept = (fieldsToKeep: keyof ControlFormData | (keyof ControlFormData)[]) => {
    setClearData(true)
    const keepArray = Array.isArray(fieldsToKeep) ? fieldsToKeep : [fieldsToKeep]
    const preservedValues = keepArray.reduce((acc, key) => {
      acc[key] = form.getValues(key)
      return acc
    }, {} as Partial<ControlFormData>)
    const controlID = form.getValues('controlID')
    reset({ controlID, ...initialValues, ...preservedValues })
  }

  const onSubmit = async (formData: ControlFormData) => {
    const { desiredOutcome, details, ...data } = formData
    try {
      let newId: string | undefined

      const commonInput = {
        ...data,
        description: await convertToHtml(data.descriptionJSON as Value),
        descriptionJSON: data.descriptionJSON,
        referenceID: data.referenceID || undefined,
        auditorReferenceID: data.auditorReferenceID || undefined,
        ...associations,
      }

      if (isCreateSubcontrol) {
        const response = await createSubcontrol({ input: commonInput as CreateSubcontrolInput })
        newId = response?.createSubcontrol?.subcontrol?.id
      } else {
        const response = await createControl({ input: commonInput as CreateControlInput })
        newId = response?.createControl?.control?.id
      }

      if (newId && (mappedControls.controls.length > 0 || mappedControls.subcontrols.length > 0)) {
        const input: CreateMappedControlInput = {
          mappingType: MappedControlMappingType.PARTIAL,
          source: MappedControlMappingSource.MANUAL,
          confidence: 100,
          fromControlIDs: isCreateSubcontrol ? [] : [newId],
          fromSubcontrolIDs: isCreateSubcontrol ? [newId] : [],
          toControlIDs: mappedControls.controls.map((c) => c.id),
          toSubcontrolIDs: mappedControls.subcontrols.map((c) => c.id),
          relation: 'Mapping auto-created based on creation of control from framework',
        }

        await createMappedControl({ input })
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
        resetAllExcept(['controlOwnerID', 'delegateID', 'category', 'subcategory', 'controlKindName', 'source', 'subcontrolKindName'])
        successNotification({ title: 'Control created successfully' })
      } else if (newId && isCreateSubcontrol) {
        successNotification({ title: 'Control created successfully, redirecting...' })
        router.push(`/controls/${form.getValues('controlID')}/${newId}`)
      } else if (newId) {
        successNotification({ title: 'Control created successfully, redirecting...' })
        router.push(`/controls/${newId}`)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
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
    let lastCrumbLabel = 'Create Control'

    if (isCloning) {
      lastCrumbLabel = 'Clone Control'
    } else if (isCreateSubcontrol) {
      lastCrumbLabel = 'Create Subcontrol'
    }

    crumbs.push({ label: lastCrumbLabel })

    setCrumbs(crumbs)
  }, [setCrumbs, controlData, isLoading, isCreateSubcontrol, id, isCloning])

  useEffect(() => {
    if (isCloning && controlData?.control && !dataInitialized) {
      form.reset({
        refCode: `CC-${controlData?.control.refCode}`,
        description: controlData?.control.description ?? undefined,
        descriptionJSON: controlData?.control.descriptionJSON ?? undefined,
        category: controlData?.control.category ?? undefined,
        subcategory: controlData?.control.subcategory ?? undefined,
        source: ControlControlSource.USER_DEFINED,
        controlOwnerID: controlData?.control.controlOwner?.id ?? undefined,
        delegateID: controlData?.control.delegate?.id ?? undefined,
        controlKindName: controlData?.control.controlKindName ?? undefined,
      })
      return setDataInitialized(true)
    }

    if (controlData?.control && !dataInitialized) {
      const label = `${controlData.control.refCode} ${controlData.control?.referenceFramework ? `(${controlData.control?.referenceFramework.trim()})` : '(CUSTOM)'}`
      fillCategoryAndSubcategory(form, controlData.control)
      setSearch(label)
      setSelectedParentControlLabel(label)
      form.setValue('controlID', controlData?.control.id)
      setDataInitialized(true)
    }
  }, [controlData, form, fillCategoryAndSubcategory, selectedParentControlLabel, dataInitialized, isCloning])

  useEffect(() => {
    if (mappedControlData || mappedSubcontrolData) {
      setMappedControls((prev) => ({
        controls: mappedControlData?.control ? [...prev.controls, mappedControlData.control as Control] : prev.controls,
        subcontrols: mappedSubcontrolData?.subcontrol ? [...prev.subcontrols, mappedSubcontrolData.subcontrol as Subcontrol] : prev.subcontrols,
      }))
    }
  }, [mappedControlData, mappedSubcontrolData])

  const onCancel = () => {
    setClearData(true)
    reset()
    router.push(`/controls`)
  }

  if (!permissionsLoading && !createAllowed) {
    return <ProtectedArea />
  }

  if (permissionsLoading) {
    return <Loading />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-2xl font-semibold">{isCreateSubcontrol ? 'Create Subcontrol' : 'Create Control'}</div>

        <div className="flex gap-12">
          <div className="w-[55%]">
            {/* Name */}
            <div>
              <Label>
                Name <span className="text-destructive">*</span>
              </Label>
              {errors?.refCode && <p className="text-destructive text-sm mt-1">{errors.refCode.message}</p>}
              <Controller name="refCode" control={control} rules={{ required: true }} render={({ field }) => <Input {...field} />} />
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
                name="descriptionJSON"
                control={control}
                render={({ field }) => (
                  <PlateEditor
                    initialValue={controlData?.control?.descriptionJSON ?? controlData?.control?.description ?? (form.getValues('description') as string) ?? undefined}
                    clearData={clearData}
                    entity={discussionData?.control}
                    userData={userData}
                    onClear={() => setClearData(false)}
                    onChange={field.onChange}
                    isCreate={!id}
                  />
                )}
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
                    <PlateEditor initialValue={field.value as string} clearData={clearData} onClear={() => setClearData(false)} onChange={field.onChange} placeholder="Enter the control objective" />
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
                <Button variant="primary" type="submit">
                  Create
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel}>
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
          <div className="w-[45%] flex flex-col gap-5">
            <PropertiesCard isEditing canEdit />
            <RelatedControls onSave={setMappedControls} mappedControls={mappedControls} />
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-2">Create associations</h3>
              <div className="flex flex-col gap-4"></div>
              <ObjectAssociation
                onIdChange={(updatedMap) => {
                  setAssociations((prev) => {
                    const prevKeys = Object.keys(prev)
                    const updatedKeys = Object.keys(updatedMap)
                    if (prevKeys.length === updatedKeys.length && prevKeys.every((k) => prev[k] === updatedMap[k])) {
                      return prev
                    }
                    return updatedMap
                  })
                }}
                initialData={associations}
                excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.CONTROL, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.GROUP]}
              />
            </Card>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
