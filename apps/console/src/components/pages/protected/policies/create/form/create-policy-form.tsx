'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from 'platejs'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { useCreateInternalPolicy, useGetInternalPolicyAssociationsById, useGetPolicyDiscussionById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import { CreateInternalPolicyInput, InternalPolicyByIdFragment, InternalPolicyDocumentStatus, InternalPolicyFrequency, UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { usePathname, useRouter } from 'next/navigation'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema, { CreatePolicyFormData, EditPolicyFormData } from '../hooks/use-form-schema'
import { usePolicy } from '../hooks/use-policy'
import StatusCard from '@/components/pages/protected/policies/create/cards/status-card.tsx'
import AssociationCard from '@/components/pages/protected/policies/create/cards/association-card.tsx'
import TagsCard from '@/components/pages/protected/policies/create/cards/tags-card.tsx'
import AuthorityCard from '@/components/pages/protected/policies/view/cards/authority-card.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Switch } from '@repo/ui/switch'
import HelperText from './alert-box'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { useSession } from 'next-auth/react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button'

type TCreatePolicyFormProps = {
  policy?: InternalPolicyByIdFragment
}

export type TMetadata = {
  createdAt: string
  updatedAt: string
  revision: string
}

const CreatePolicyForm: React.FC<TCreatePolicyFormProps> = ({ policy }) => {
  const path = usePathname()
  const { form } = useFormSchema()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync: createPolicy, isPending: isCreating } = useCreateInternalPolicy()
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()
  const isSubmitting = isCreating || isSaving
  const { successNotification, errorNotification } = useNotification()
  const associationsState = usePolicy((state) => state.associations)
  const policyState = usePolicy()
  const [metadata, setMetadata] = useState<TMetadata>()
  const isEditable = !!policy
  const [initialAssociations, setInitialAssociations] = useState<TObjectAssociationMap>({})
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [isInitialized, setIsInitialized] = useState(false)
  const { data: assocData } = useGetInternalPolicyAssociationsById(policy?.id || null)
  const { data: discussionData } = useGetPolicyDiscussionById(policy?.id || null)
  const isPoliciesCreate = path === '/policies/create'
  const [createMultiple, setCreateMultiple] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const plateEditorHelper = usePlateEditor()

  useEffect(() => {
    if (policy && assocData) {
      const policyAssociations: TObjectAssociationMap = {
        controlIDs: (assocData.internalPolicy?.controls?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        procedureIDs: (assocData.internalPolicy?.procedures?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        programIDs: (assocData.internalPolicy?.programs?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        controlObjectiveIDs: (assocData.internalPolicy?.controlObjectives?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        taskIDs: (assocData.internalPolicy?.tasks?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
      }

      const policyAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: (assocData.internalPolicy?.controls?.edges?.map((item) => item?.node?.refCode).filter(Boolean) as string[]) || [],
        procedureIDs: (assocData.internalPolicy?.procedures?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
        programIDs: (assocData.internalPolicy?.programs?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
        controlObjectiveIDs: (assocData.internalPolicy?.controlObjectives?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
        taskIDs: (assocData.internalPolicy?.tasks?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
      }

      form.reset({
        tags: policy.tags ?? [],
        details: policy?.details ?? '',
        name: policy.name,
        approvalRequired: policy?.approvalRequired ?? true,
        status: policy.status ?? InternalPolicyDocumentStatus.DRAFT,
        reviewDue: policy.reviewDue ? new Date(policy.reviewDue as string) : undefined,
        reviewFrequency: policy.reviewFrequency ?? InternalPolicyFrequency.YEARLY,
        internalPolicyKindName: policy.internalPolicyKindName ?? undefined,
      })

      setMetadata({
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        revision: policy?.revision ?? '',
      })

      setInitialAssociations(policyAssociations)
      policyState.setAssociations(policyAssociations)
      policyState.setAssociationRefCodes(policyAssociationsRefCodes)
    }
  }, [isPoliciesCreate, form, policy, policyState, assocData])

  useEffect(() => {
    if (!isInitialized && isPoliciesCreate && Object.keys(policyState.associations).length > 0) {
      setInitialAssociations({})
      policyState.setAssociations({})
      policyState.setAssociationRefCodes({})
      return
    }
    setIsInitialized(true)
  }, [isPoliciesCreate, policyState, isInitialized])

  const onCreateHandler = async (data: CreatePolicyFormData) => {
    try {
      const formData: { input: CreateInternalPolicyInput } = {
        input: {
          ...data,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associationsState,
        },
      }

      const createdPolicy = await createPolicy(formData)

      successNotification({
        title: 'Policy Created',
        description: 'Policy has been successfully created',
      })

      if (createMultiple) {
        setClearData(true)
        form.reset({
          name: '',
          details: '',
          approvalRequired: data.approvalRequired,
          status: data.status,
          internalPolicyKindName: data.internalPolicyKindName,
          reviewDue: data.reviewDue,
          reviewFrequency: data.reviewFrequency,
          approverID: data.approverID,
          delegateID: data.delegateID,
          tags: data.tags ?? [],
          ...associationsState,
        })
      } else {
        router.push(`/policies/${createdPolicy.createInternalPolicy.internalPolicy.id}/view`)
      }
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

  const onSaveHandler = async (data: EditPolicyFormData) => {
    if (!policy) {
      return
    }
    try {
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
        updateInternalPolicyId: policy.id,
        input: {
          ...data,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
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
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      router.push(`/policies`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDetailsChange = (value: Value) => {
    form.setValue('detailsJSON', value)
  }

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Internal Policies - ${policy?.name}`}</title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(isEditable ? onSaveHandler : onCreateHandler)} className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1 space-y-6 min-w-0">
            {isEditable ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Edit & draft approval process</AlertTitle>
                <AlertDescription>
                  <p>Editing Title, Policy will trigger a draft creation and require approval procedure.</p>
                </AlertDescription>
              </Alert>
            ) : (
              <HelperText
                name={form.getValues('name')}
                editorRef={editorRef}
                onNameChange={(newName) => {
                  form.setValue('name', newName)
                }}
              />
            )}

            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <div className="flex items-center">
                      <FormLabel>Title</FormLabel>
                      <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the policy later.</p>} />
                    </div>
                    <FormControl>
                      <Input variant="medium" {...field} className="w-full min-w-0" />
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
                name="detailsJSON"
                render={() => (
                  <FormItem className="w-full min-w-0">
                    <div className="flex items-center">
                      <FormLabel>Policy</FormLabel>
                      <SystemTooltip
                        icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                        content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                      />
                    </div>
                    <PlateEditor
                      ref={editorRef}
                      onChange={handleDetailsChange}
                      userData={userData}
                      entity={discussionData?.internalPolicy}
                      clearData={clearData}
                      isCreate={!policy?.id}
                      onClear={() => setClearData(false)}
                      initialValue={policy?.detailsJSON ?? policy?.details ?? (form.getValues('details') as string) ?? undefined}
                    />
                    {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
            <div className="flex justify-between items-center">
              <SaveButton disabled={isSubmitting} title={isSubmitting ? (isEditable ? 'Saving' : 'Creating policy') : isEditable ? 'Save' : 'Save Changes'} />
              <div className="flex items-center gap-2">
                <Switch checked={createMultiple} onCheckedChange={setCreateMultiple} />
                <span>Create multiple</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-[380px] space-y-4">
            <AuthorityCard form={form} isEditing={true} inputClassName="w-[162px]" editAllowed={true} isCreate={true} />
            <StatusCard form={form} metadata={metadata} />
            <AssociationCard />
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreatePolicyForm
