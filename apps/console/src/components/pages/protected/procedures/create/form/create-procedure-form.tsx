'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { type Value } from 'platejs'
import { type CreateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRouter, useSearchParams } from 'next/navigation'
import useFormSchema, { type CreateProcedureFormData } from '../hooks/use-form-schema'
import { PROCEDURE_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { ProcedureAssociationSection } from '@/components/pages/protected/procedures/create/form/fields/association-section'
import StatusCard from '@/components/pages/protected/procedures/create/cards/status-card.tsx'
import TagsCard from '@/components/pages/protected/procedures/create/cards/tags-card.tsx'
import { useCreateProcedure } from '@/lib/graphql-hooks/procedure.ts'
import AuthorityCard from '@/components/pages/protected/procedures/view/cards/authority-card.tsx'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/internal-policy.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher.ts'
import { ProcedureHelpCallout } from '@/components/pages/protected/procedures/create/form/procedure-help-callout'
import { Switch } from '@repo/ui/switch'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button.tsx'
import { useFormDraft } from '@/hooks/useFormDraft.ts'
import DraftRestoreModal from '@/components/shared/draft-restore-modal/draft-restore-modal.tsx'

const PROCEDURE_DRAFT_KEY = 'draft:procedure-create'

export type TMetadata = {
  createdAt: string
  updatedAt: string
  revision: string
}

const CreateProcedureForm: React.FC = () => {
  const { form } = useFormSchema()
  const router = useRouter()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { mutateAsync: createProcedure, isPending: isSubmitting } = useCreateProcedure()
  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const policyId = searchParams.get('policyId')
  const { data } = useGetInternalPolicyDetailsById(policyId)
  const { currentOrgId } = useOrganization()
  const [createMultiple, setCreateMultiple] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)

  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const plateEditorHelper = usePlateEditor()

  const { pendingDraft, restore, discard, clearDraft, editorKey } = useFormDraft<CreateProcedureFormData>({
    storageKey: PROCEDURE_DRAFT_KEY,
    organizationId: currentOrgId,
    enabled: true,
    form,
  })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Procedures', href: '/procedures' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (data?.internalPolicy?.id) {
      const current = form.getValues('internalPolicyIDs') ?? []
      if (!current.includes(data.internalPolicy.id)) {
        form.setValue('internalPolicyIDs', [...current, data.internalPolicy.id], { shouldDirty: true })
      }
    }
  }, [data, form])

  const onCreateHandler = async (data: CreateProcedureFormData) => {
    try {
      const associationInputs = buildAssociationPayload(PROCEDURE_ASSOCIATION_CONFIG.associationKeys, data, true, {})
      const { internalPolicyIDs: _ip, controlIDs: _c, subcontrolIDs: _sc, programIDs: _p, taskIDs: _t, riskIDs: _r, ...nonAssociationData } = data

      const formData: { input: CreateProcedureInput } = {
        input: {
          ...nonAssociationData,
          ...associationInputs,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
          tags: data?.tags ?? [],
        },
      }

      const createdProcedure = await createProcedure(formData)
      successNotification({
        title: 'Procedure Created',
        description: 'Procedure has been successfully created',
      })

      clearDraft()

      if (createMultiple) {
        setClearData(true)
        const { name: _name, details: _details, detailsJSON: _detailsJSON, ...preserved } = data
        form.reset({ name: '', details: '', ...preserved })
      } else {
        router.push(`/procedures/${createdProcedure.createProcedure.procedure.id}/view`)
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
    form.setValue('detailsJSON', value, { shouldDirty: true })
  }

  return (
    <>
      {pendingDraft && <DraftRestoreModal open savedAt={pendingDraft.savedAt} entityLabel="procedure" onResume={restore} onDiscard={discard} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onCreateHandler)} className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1 space-y-6 min-w-0">
            <ProcedureHelpCallout />
            {/* Title Field */}
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <div className="flex items-center">
                      <FormLabel>Title</FormLabel>
                      <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the procedure later.</p>} />
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
                    <FormLabel>Procedure</FormLabel>
                    <SystemTooltip
                      icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                      content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                    />
                    <PlateEditor
                      key={editorKey}
                      onChange={handleDetailsChange}
                      userData={userData}
                      clearData={clearData}
                      onClear={() => setClearData(false)}
                      isCreate
                      initialValue={form.getValues('detailsJSON') ?? (form.getValues('details') as string) ?? undefined}
                    />
                    {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

            <ProcedureAssociationSection isEditing={false} isCreate isEditAllowed={true} />
            <div className="flex justify-between items-center">
              <SaveButton disabled={isSubmitting} title={isSubmitting ? 'Creating procedure' : 'Save Procedure'} />
              <div className="flex items-center gap-2">
                <Switch aria-label="Create another procedure" checked={createMultiple} onCheckedChange={setCreateMultiple} />
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

export default CreateProcedureForm
