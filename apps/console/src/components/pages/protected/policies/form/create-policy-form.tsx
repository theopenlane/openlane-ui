'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import useFormSchema, { CreatePolicyFormData, EditPolicyFormData } from '@/components/pages/protected/policies/hooks/use-form-schema.ts'
import StatusCard from '@/components/pages/protected/policies/cards/status-card.tsx'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from '@udecode/plate-common'
import AssociationCard from '@/components/pages/protected/policies/cards/association-card.tsx'
import TagsCard from '@/components/pages/protected/policies/cards/tags-card.tsx'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { Button } from '@repo/ui/button'
import { useCreateInternalPolicy, useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import { CreateInternalPolicyInput, InternalPolicyByIdFragment, InternalPolicyDocumentStatus, InternalPolicyFrequency, UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { useNotification } from '@/hooks/useNotification.tsx'
import { usePolicy } from '@/components/pages/protected/policies/hooks/use-policy.tsx'
import { useRouter } from 'next/navigation'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'

type TCreatePolicyFormProps = {
  policy?: InternalPolicyByIdFragment
}

export type TMetadata = {
  createdAt: string
  updatedAt: string
}

const CreatePolicyForm: React.FC<TCreatePolicyFormProps> = ({ policy }) => {
  const { form } = useFormSchema()
  const router = useRouter()
  const { mutateAsync: createPolicy, isPending: isCreating } = useCreateInternalPolicy()
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()
  const isSubmitting = isCreating || isSaving
  const plateEditorHelper = usePlateEditor()
  const { successNotification, errorNotification } = useNotification()
  const associationsState = usePolicy((state) => state.associations)
  const policyState = usePolicy()
  const [metadata, setMetadata] = useState<TMetadata>()
  const isEditable = !!policy
  const [initialAssociations, setInitialAssociations] = useState<TObjectAssociationMap>({})

  useEffect(() => {
    if (policy) {
      const policyAssociations: TObjectAssociationMap = {
        controlIDs: policy?.controls?.edges?.map((item) => item?.node?.id!) || [],
        procedureIDs: policy?.procedures?.edges?.map((item) => item?.node?.id!) || [],
        programIDs: policy?.programs?.edges?.map((item) => item?.node?.id!) || [],
        controlObjectiveIDs: policy?.controlObjectives?.edges?.map((item) => item?.node?.id!) || [],
        taskIDs: policy?.tasks?.edges?.map((item) => item?.node?.id!) || [],
      }

      const policyAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: policy?.controls?.edges?.map((item) => item?.node?.refCode!) || [],
        procedureIDs: policy?.procedures?.edges?.map((item) => item?.node?.refCode!) || [],
        programIDs: policy?.programs?.edges?.map((item) => item?.node?.displayID!) || [],
        controlObjectiveIDs: policy?.controlObjectives?.edges?.map((item) => item?.node?.displayID!) || [],
        taskIDs: policy?.tasks?.edges?.map((item) => item?.node?.displayID!) || [],
      }

      form.reset({
        tags: policy.tags ?? [],
        details: policy?.details ?? '',
        name: policy.name,
        approvalRequired: policy?.approvalRequired ?? true,
        status: policy.status ?? InternalPolicyDocumentStatus.DRAFT,
        policyType: policy.policyType ?? '',
        reviewDue: policy.reviewDue ? new Date(policy.reviewDue as string) : undefined,
        reviewFrequency: policy.reviewFrequency ?? InternalPolicyFrequency.YEARLY,
      })

      setMetadata({
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      })

      setInitialAssociations(policyAssociations)
      policyState.setAssociations(policyAssociations)
      policyState.setAssociationRefCodes(policyAssociationsRefCodes)
    }
  }, [])

  const onCreateHandler = async (data: CreatePolicyFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const formData: { input: CreateInternalPolicyInput } = {
        input: {
          ...data,
          details: detailsField,
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associationsState,
        },
      }

      await createPolicy(formData)

      successNotification({
        title: 'Policy Created',
        description: 'Policy has been successfully created',
      })

      form.reset()
      router.push(`/policies`)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the policy. Please try again.',
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

  const onSaveHandler = async (data: EditPolicyFormData) => {
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

      const formData: {
        updateInternalPolicyId: string
        input: UpdateInternalPolicyInput
      } = {
        updateInternalPolicyId: policy?.id!,
        input: {
          ...data,
          details: detailsField,
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associationInputs,
        },
      }

      await updatePolicy(formData)

      successNotification({
        title: 'Policy Updated',
        description: 'Policy has been successfully updated',
      })

      form.reset()
      router.push(`/policies`)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error updating the policy. Please try again.',
      })
    }
  }

  const handleDetailsChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(isEditable ? onSaveHandler : onCreateHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          {isEditable && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Edit & draft approval process</AlertTitle>
              <AlertDescription>
                <p>Editing Title, Policy will trigger a draft creation and require approval procedure.</p>
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
                  <a className="text-blue-600" href="https://docs.theopenlane.io/docs/category/policies-and-procedures" target="_blank">
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
                    <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the policy later.</p>} />
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
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Policy</FormLabel>
                  <SystemTooltip
                    icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                    content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                  />
                  <PlateEditor onChange={handleDetailsChange} variant="basic" initialValue={policy?.details} />
                  {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                </FormItem>
              )}
            />
          </InputRow>

          <Button className="mt-4" type="submit" variant="filled" disabled={isSubmitting}>
            {isSubmitting ? (isEditable ? 'Saving' : 'Creating policy') : isEditable ? 'Save' : 'Create Policy'}
          </Button>
        </div>
        <div className="space-y-4">
          <StatusCard form={form} metadata={metadata} />
          <AssociationCard />
          <TagsCard form={form} />
        </div>
      </form>
    </Form>
  )
}

export default CreatePolicyForm
