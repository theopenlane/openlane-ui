'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { type Value } from 'platejs'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { useCreateInternalPolicy, useGetInternalPolicyAssociationsById, useGetPolicyDiscussionById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { type CreateInternalPolicyInput, type InternalPolicyByIdFragment, InternalPolicyDocumentStatus, InternalPolicyFrequency, type UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRouter } from 'next/navigation'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema, { type CreatePolicyFormData, type EditPolicyFormData } from '../hooks/use-form-schema'
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
import { getAssociationInput } from '@/components/shared/object-association/utils'

type TCreatePolicyFormProps = {
  policy?: InternalPolicyByIdFragment
}

export type TMetadata = {
  createdAt: string
  updatedAt: string
  revision: string
}

const CreatePolicyForm: React.FC<TCreatePolicyFormProps> = ({ policy }) => {
  const { form } = useFormSchema()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync: createPolicy, isPending: isCreating } = useCreateInternalPolicy()
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()
  const isSubmitting = isCreating || isSaving
  const { successNotification, errorNotification } = useNotification()
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [initialAssociations, setInitialAssociations] = useState<TObjectAssociationMap>({})
  const [associationRefCodes, setAssociationRefCodes] = useState<TObjectAssociationMap>({
    taskIDs: [],
    controlObjectiveIDs: [],
    controlIDs: [],
    procedureIDs: [],
    programIDs: [],
  })
  const metadata = useMemo<TMetadata | undefined>(
    () =>
      policy
        ? {
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt,
            revision: policy?.revision ?? '',
          }
        : undefined,
    [policy],
  )
  const isEditable = !!policy
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
  const { data: assocData } = useGetInternalPolicyAssociationsById(policy?.id || null)
  const { data: discussionData } = useGetPolicyDiscussionById(policy?.id || null)
  const [createMultiple, setCreateMultiple] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const plateEditorHelper = usePlateEditor()

  const [prevAssocData, setPrevAssocData] = useState(assocData)
  if (policy && assocData && assocData !== prevAssocData) {
    setPrevAssocData(assocData)
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

    setInitialAssociations(policyAssociations)
    setAssociations(policyAssociations)
    setAssociationRefCodes(policyAssociationsRefCodes)
  }

  const handleAssociationsChange = useCallback((newAssociations: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => {
    setAssociations(newAssociations)
    setAssociationRefCodes(newRefCodes)
  }, [])

  const onCreateHandler = async (data: CreatePolicyFormData) => {
    try {
      const formData: { input: CreateInternalPolicyInput } = {
        input: {
          ...data,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associations,
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
          ...associations,
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

  const onSaveHandler = async (data: EditPolicyFormData) => {
    if (!policy) {
      return
    }
    try {
      const associationInputs = getAssociationInput(initialAssociations, associations)

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
            <AssociationCard associations={associations} initialAssociations={initialAssociations} associationRefCodes={associationRefCodes} onAssociationsChange={handleAssociationsChange} />
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreatePolicyForm
