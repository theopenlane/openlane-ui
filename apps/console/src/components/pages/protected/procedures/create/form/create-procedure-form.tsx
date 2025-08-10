'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from 'platejs'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { Button } from '@repo/ui/button'
import { CreateProcedureInput, ProcedureByIdFragment, ProcedureDocumentStatus, ProcedureFrequency, UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { useNotification } from '@/hooks/useNotification.tsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema, { CreateProcedureFormData } from '../hooks/use-form-schema'
import { useProcedure } from '../hooks/use-procedure.tsx'
import StatusCard from '@/components/pages/protected/procedures/create/cards/status-card.tsx'
import AssociationCard from '@/components/pages/protected/procedures/create/cards/association-card.tsx'
import TagsCard from '@/components/pages/protected/procedures/create/cards/tags-card.tsx'
import { useCreateProcedure, useUpdateProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { DOCS_URL } from '@/constants/index.ts'
import AuthorityCard from '@/components/pages/protected/procedures/view/cards/authority-card.tsx'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher.ts'

type TCreateProcedureFormProps = {
  procedure?: ProcedureByIdFragment
}

export type TMetadata = {
  createdAt: string
  updatedAt: string
  revision: string
}

const CreateProcedureForm: React.FC<TCreateProcedureFormProps> = ({ procedure }) => {
  const path = usePathname()
  const { form } = useFormSchema()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { mutateAsync: createProcedure, isPending: isCreating } = useCreateProcedure()
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()
  const isSubmitting = isCreating || isSaving
  const plateEditorHelper = usePlateEditor()
  const { successNotification, errorNotification } = useNotification()
  const associationsState = useProcedure((state) => state.associations)
  const procedureState = useProcedure()
  const [metadata, setMetadata] = useState<TMetadata>()
  const isEditable = !!procedure
  const [initialAssociations, setInitialAssociations] = useState<TObjectAssociationMap>({})
  const searchParams = useSearchParams()
  const policyId = searchParams.get('policyId')
  const { data } = useGetInternalPolicyDetailsById(policyId)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [isInitialized, setIsInitialized] = useState(false)

  const isProcedureCreate = path === '/procedures/create'

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Procedures', href: '/procedures' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (procedure) {
      const procedureAssociations: TObjectAssociationMap = {
        controlIDs: procedure?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        internalPolicyIDs: procedure?.internalPolicies?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        programIDs: procedure?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        risks: procedure?.risks?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        taskIDs: procedure?.tasks?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
      }

      const procedureAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: procedure?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => typeof id === 'string') || [],
        internalPolicyIDs: procedure?.internalPolicies?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
        programIDs: procedure?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
        risks: procedure?.risks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
        taskIDs: procedure?.tasks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
      }

      form.reset({
        tags: procedure.tags ?? [],
        details: procedure?.details ?? '',
        name: procedure.name,
        approvalRequired: procedure?.approvalRequired ?? true,
        status: procedure.status ?? ProcedureDocumentStatus.DRAFT,
        procedureType: procedure.procedureType ?? '',
        reviewDue: procedure.reviewDue ? new Date(procedure.reviewDue as string) : undefined,
        reviewFrequency: procedure.reviewFrequency ?? ProcedureFrequency.YEARLY,
      })

      setMetadata({
        createdAt: procedure.createdAt,
        updatedAt: procedure.updatedAt,
        revision: procedure?.revision ?? '',
      })

      setInitialAssociations(procedureAssociations)
      procedureState.setAssociations(procedureAssociations)
      procedureState.setAssociationRefCodes(procedureAssociationsRefCodes)
    }
  }, [form, procedure, procedureState])

  useEffect(() => {
    if (!isInitialized && isProcedureCreate && Object.keys(procedureState.associations).length > 0) {
      setInitialAssociations({})
      procedureState.setAssociations({})
      procedureState.setAssociationRefCodes({})
      return
    }
    setIsInitialized(true)
  }, [isProcedureCreate, procedureState, isInitialized])

  useEffect(() => {
    if (data) {
      const procedureAssociations: TObjectAssociationMap = {
        internalPolicyIDs: data?.internalPolicy?.id ? [data.internalPolicy.id] : [],
      }
      const procedureAssociationsRefCodes: TObjectAssociationMap = {
        internalPolicyIDs: data?.internalPolicy?.displayID ? [data.internalPolicy.displayID] : [],
      }
      setInitialAssociations(procedureAssociations)
      procedureState.setAssociations(procedureAssociations)
      procedureState.setAssociationRefCodes(procedureAssociationsRefCodes)
    }
  }, [data, procedureState])

  const onCreateHandler = async (data: CreateProcedureFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const formData: { input: CreateProcedureInput } = {
        input: {
          ...data,
          details: detailsField,
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associationsState,
        },
      }

      const createdProcedure = await createProcedure(formData)

      successNotification({
        title: 'Procedure Created',
        description: 'Procedure has been successfully created',
      })

      form.reset()
      router.push(`/procedures/${createdProcedure.createProcedure.procedure.id}/view`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  function getAssociationDiffs(initial: TObjectAssociationMap, current: TObjectAssociationMap): { added: TObjectAssociationMap; removed: TObjectAssociationMap } {
    const added: TObjectAssociationMap = {}
    const removed: TObjectAssociationMap = {}

    const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

    for (const key of allKeys) {
      const initialSet = new Set(initial[key] ?? [])
      const currentSet = new Set(current[key] ?? [])

      const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
      const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

      if (addedItems.length > 0) {
        added[key] = addedItems
      }
      if (removedItems.length > 0) {
        removed[key] = removedItems
      }
    }

    return { added, removed }
  }

  const onSaveHandler = async (data: CreateProcedureFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const { added, removed } = getAssociationDiffs(initialAssociations, associationsState)

      const buildMutationKey = (prefix: string, key: string) => `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`

      const associationInputs = {
        ...Object.entries(added).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('add', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),

        ...Object.entries(removed).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('remove', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),
      }

      if (!procedure) {
        return
      }

      const formData: {
        updateProcedureId: string
        input: UpdateProcedureInput
      } = {
        updateProcedureId: procedure.id,
        input: {
          ...data,
          details: detailsField,
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associationInputs,
        },
      }

      await updateProcedure(formData)

      successNotification({
        title: 'Procedure Updated',
        description: 'Procedure has been successfully updated',
      })

      form.reset()
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
      queryClient.invalidateQueries({ queryKey: ['procedure', procedure?.id] })
      router.push(`/procedures`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDetailsChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <>
      {isEditable && <title>{`${currentOrganization?.node?.displayName}: Procedures - ${procedure?.name}`}</title>}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(isEditable ? onSaveHandler : onCreateHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            {isEditable && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Edit & draft approval process</AlertTitle>
                <AlertDescription>
                  <p>Editing Title, Procedure will trigger a draft creation and require approval.</p>
                </AlertDescription>
              </Alert>
            )}
            {!isEditable && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Not sure what to write?</AlertTitle>
                <AlertDescription>
                  <p>
                    For template library and help docs, please refer to our{' '}
                    <a className="text-blue-600" href={`${DOCS_URL}/docs/category/policies-and-procedures`} target="_blank" rel="noreferrer">
                      documentation
                    </a>
                    .
                  </p>
                </AlertDescription>
              </Alert>
            )}
            {/* Title Field */}
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className="flex items-center">
                      <FormLabel>Title</FormLabel>
                      <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the procedure later.</p>} />
                    </div>
                    <FormControl>
                      <Input variant="medium" {...field} className="w-full" />
                    </FormControl>
                    {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

            {/* details Field */}
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="details"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel>Procedure</FormLabel>
                    <SystemTooltip
                      icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                      content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                    />
                    <PlateEditor onChange={handleDetailsChange} initialValue={procedure?.details ?? undefined} />
                    {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

            <Button className="mt-4" type="submit" variant="filled" disabled={isSubmitting}>
              {isSubmitting ? (isEditable ? 'Saving' : 'Creating procedure') : isEditable ? 'Save' : 'Create Procedure'}
            </Button>
          </div>
          <div className="space-y-4">
            <AuthorityCard form={form} isEditing={true} inputClassName="!w-[162px]" editAllowed={true} />
            <StatusCard form={form} metadata={metadata} />
            <AssociationCard />
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreateProcedureForm
