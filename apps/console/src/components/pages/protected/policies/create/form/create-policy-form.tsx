'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import React, { useRef, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { type Value } from 'platejs'
import { useCreateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { type CreateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRouter } from 'next/navigation'
import useFormSchema, { type CreatePolicyFormData } from '../hooks/use-form-schema'
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

const CreatePolicyForm: React.FC = () => {
  const { form } = useFormSchema()
  const router = useRouter()
  const { mutateAsync: createPolicy, isPending: isCreating } = useCreateInternalPolicy()
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
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
    enabled: true,
    form,
  })

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

  const handleDetailsChange = (value: Value) => {
    form.setValue('detailsJSON', value)
  }

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Internal Policies - Create`}</title>
      {pendingDraft && <DraftRestoreModal open savedAt={pendingDraft.savedAt} entityLabel="policy" onResume={restore} onDiscard={discard} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onCreateHandler)} className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1 space-y-6 min-w-0">
            <HelperText
              name={form.getValues('name')}
              editorRef={editorRef}
              onNameChange={(newName) => {
                form.setValue('name', newName)
              }}
            />

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
                      clearData={clearData}
                      isCreate={true}
                      onClear={() => setClearData(false)}
                      initialValue={form.getValues('detailsJSON') ?? (form.getValues('details') as string) ?? undefined}
                    />
                    {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
            <PolicyAssociationSection isEditing={false} isCreate={true} isEditAllowed={true} />
            <div className="flex justify-between items-center">
              <SaveButton disabled={isCreating} title={isCreating ? 'Creating policy' : 'Save Changes'} />
              <div className="flex items-center gap-2">
                <Switch checked={createMultiple} onCheckedChange={setCreateMultiple} />
                <span>Create multiple</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-[380px] space-y-4">
            <AuthorityCard form={form} isEditing={true} inputClassName="w-[162px]" editAllowed={true} isCreate={true} />
            <StatusCard form={form} />
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreatePolicyForm
