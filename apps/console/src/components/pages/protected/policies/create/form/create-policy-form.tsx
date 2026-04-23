'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { type Value } from 'platejs'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { useCreateInternalPolicy, useGetInternalPolicyAssociationsById, useGetPolicyDiscussionById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { type CreateInternalPolicyInput, type InternalPolicyByIdFragment, InternalPolicyDocumentStatus, InternalPolicyFrequency, type UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema, { type CreatePolicyFormData, type EditPolicyFormData } from '../hooks/use-form-schema'
import { POLICY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { buildAssociationPayload, buildInitialAssociationIds } from '@/components/shared/object-association/utils'
import { type AssociationsData } from '@/components/shared/object-association/association-section'
import { PolicyAssociationSection } from '@/components/pages/protected/policies/create/form/fields/association-section'
import StatusCard from '@/components/pages/protected/policies/create/cards/status-card.tsx'
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
import { useFormDraft } from '@/hooks/useFormDraft.ts'
import DraftRestoreModal from '@/components/shared/draft-restore-modal/draft-restore-modal.tsx'

const POLICY_DRAFT_KEY = 'draft:policy-create'

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
  const [metadata, setMetadata] = useState<TMetadata>()
  const isEditable = !!policy
  const [initialAssociations, setInitialAssociations] = useState<ReturnType<typeof buildInitialAssociationIds<typeof POLICY_ASSOCIATION_CONFIG>>>({})
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

  const { pendingDraft, restore, discard, clearDraft, editorKey } = useFormDraft<CreatePolicyFormData>({
    storageKey: POLICY_DRAFT_KEY,
    enabled: !isEditable,
    form,
  })

  const policyAssociations = useMemo(() => buildInitialAssociationIds(POLICY_ASSOCIATION_CONFIG, assocData as AssociationsData | undefined), [assocData])

  useEffect(() => {
    if (!policy) return

    form.reset({
      tags: policy.tags ?? [],
      details: policy?.details ?? '',
      name: policy.name,
      approvalRequired: policy?.approvalRequired ?? true,
      status: policy.status ?? InternalPolicyDocumentStatus.DRAFT,
      reviewDue: policy.reviewDue ? new Date(policy.reviewDue as string) : undefined,
      reviewFrequency: policy.reviewFrequency ?? InternalPolicyFrequency.YEARLY,
      internalPolicyKindName: policy.internalPolicyKindName ?? undefined,
      ...policyAssociations,
    })

    setMetadata({
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      revision: policy?.revision ?? '',
    })

    setInitialAssociations(policyAssociations)
  }, [policy, form, policyAssociations])

  const onCreateHandler = async (data: CreatePolicyFormData) => {
    try {
      const formData: { input: CreateInternalPolicyInput } = {
        input: {
          ...data,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
        },
      }

      const createdPolicy = await createPolicy(formData)

      successNotification({
        title: 'Policy Created',
        description: 'Policy has been successfully created',
      })

      clearDraft()

      if (createMultiple) {
        setClearData(true)
        const { name: _name, details: _details, detailsJSON: _detailsJSON, ...preserved } = data
        form.reset({ name: '', details: '', ...preserved })
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
      const associationKeys = POLICY_ASSOCIATION_CONFIG.associationKeys as readonly (keyof typeof POLICY_ASSOCIATION_CONFIG.initialDataKeys)[]
      const associationInputs = buildAssociationPayload(associationKeys, data, false, initialAssociations)
      const mutationData = Object.fromEntries(Object.entries(data).filter(([key]) => !(key in POLICY_ASSOCIATION_CONFIG.initialDataKeys)))

      const formData: {
        updateInternalPolicyId: string
        input: UpdateInternalPolicyInput
      } = {
        updateInternalPolicyId: policy.id,
        input: {
          ...mutationData,
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
      {pendingDraft && <DraftRestoreModal open savedAt={pendingDraft.savedAt} entityLabel="policy" onResume={restore} onDiscard={discard} />}
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
                      key={editorKey}
                      ref={editorRef}
                      onChange={handleDetailsChange}
                      userData={userData}
                      entity={discussionData?.internalPolicy}
                      clearData={clearData}
                      isCreate={!policy?.id}
                      onClear={() => setClearData(false)}
                      initialValue={policy?.detailsJSON ?? policy?.details ?? form.getValues('detailsJSON') ?? (form.getValues('details') as string) ?? undefined}
                    />
                    {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
            <PolicyAssociationSection data={policy ? { id: policy.id } : undefined} isEditing={isEditable} isCreate={!isEditable} isEditAllowed={true} />
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
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreatePolicyForm
