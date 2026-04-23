'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { type Value } from 'platejs'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { type CreateProcedureInput, type ProcedureByIdFragment, ProcedureDocumentStatus, ProcedureFrequency, type UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema, { type CreateProcedureFormData } from '../hooks/use-form-schema'
import { PROCEDURE_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type AssociationInitialIds, asAssociationsData, buildAssociationPayload, buildInitialAssociationIds } from '@/components/shared/object-association/utils'
import { ProcedureAssociationSection } from '@/components/pages/protected/procedures/create/form/fields/association-section'
import StatusCard from '@/components/pages/protected/procedures/create/cards/status-card.tsx'
import TagsCard from '@/components/pages/protected/procedures/create/cards/tags-card.tsx'
import { useCreateProcedure, useGetProcedureAssociationsById, useGetProcedureDiscussionById, useUpdateProcedure } from '@/lib/graphql-hooks/procedure.ts'
import AuthorityCard from '@/components/pages/protected/procedures/view/cards/authority-card.tsx'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/internal-policy.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher.ts'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import { Switch } from '@repo/ui/switch'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button.tsx'
import { useFormDraft } from '@/hooks/useFormDraft.ts'
import DraftRestoreModal from '@/components/shared/draft-restore-modal/draft-restore-modal.tsx'

const PROCEDURE_DRAFT_KEY = 'draft:procedure-create'

type TCreateProcedureFormProps = {
  procedure?: ProcedureByIdFragment
}

export type TMetadata = {
  createdAt: string
  updatedAt: string
  revision: string
}

const CreateProcedureForm: React.FC<TCreateProcedureFormProps> = ({ procedure }) => {
  const { form } = useFormSchema()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { mutateAsync: createProcedure, isPending: isCreating } = useCreateProcedure()
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()
  const isSubmitting = isCreating || isSaving
  const { successNotification, errorNotification } = useNotification()
  const [metadata, setMetadata] = useState<TMetadata>()
  const isEditable = !!procedure
  const [initialAssociations, setInitialAssociations] = useState<AssociationInitialIds<typeof PROCEDURE_ASSOCIATION_CONFIG>>({})
  const didInitRef = useRef(false)
  const searchParams = useSearchParams()
  const policyId = searchParams.get('policyId')
  const { data } = useGetInternalPolicyDetailsById(policyId)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
  const [createMultiple, setCreateMultiple] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)

  const { data: assocData } = useGetProcedureAssociationsById(procedure?.id || null)
  const { data: discussionData } = useGetProcedureDiscussionById(procedure?.id || null)
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const plateEditorHelper = usePlateEditor()

  const { pendingDraft, restore, discard, clearDraft, editorKey } = useFormDraft<CreateProcedureFormData>({
    storageKey: PROCEDURE_DRAFT_KEY,
    enabled: !isEditable,
    form,
  })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Procedures', href: '/procedures' },
    ])
  }, [setCrumbs])

  const procedureAssociations = useMemo(() => buildInitialAssociationIds(PROCEDURE_ASSOCIATION_CONFIG, asAssociationsData(assocData)), [assocData])

  useEffect(() => {
    if (!procedure) return

    if (didInitRef.current) {
      setInitialAssociations(procedureAssociations)
      return
    }

    form.reset({
      tags: procedure.tags ?? [],
      details: procedure?.details ?? '',
      name: procedure.name,
      approvalRequired: procedure?.approvalRequired ?? true,
      status: procedure.status ?? ProcedureDocumentStatus.DRAFT,
      procedureKindName: procedure.procedureKindName ?? '',
      reviewDue: procedure.reviewDue ? new Date(procedure.reviewDue as string) : undefined,
      reviewFrequency: procedure.reviewFrequency ?? ProcedureFrequency.YEARLY,
      ...procedureAssociations,
    })

    setMetadata({
      createdAt: procedure.createdAt,
      updatedAt: procedure.updatedAt,
      revision: procedure?.revision ?? '',
    })

    setInitialAssociations(procedureAssociations)
    didInitRef.current = true
  }, [form, procedure, procedureAssociations])

  useEffect(() => {
    if (!procedure && data?.internalPolicy?.id) {
      const current = form.getValues('internalPolicyIDs') ?? []
      if (!current.includes(data.internalPolicy.id)) {
        form.setValue('internalPolicyIDs', [...current, data.internalPolicy.id], { shouldDirty: true })
      }
    }
  }, [data, procedure, form])

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
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
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

  const onSaveHandler = async (data: CreateProcedureFormData) => {
    try {
      if (!procedure) {
        return
      }

      const associationInputs = buildAssociationPayload(PROCEDURE_ASSOCIATION_CONFIG.associationKeys, data, false, initialAssociations)
      const mutationData = Object.fromEntries(Object.entries(data).filter(([key]) => !(key in PROCEDURE_ASSOCIATION_CONFIG.initialDataKeys)))

      const formData: {
        updateProcedureId: string
        input: UpdateProcedureInput
      } = {
        updateProcedureId: procedure.id,
        input: {
          ...mutationData,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
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
    form.setValue('detailsJSON', value)
  }

  return (
    <>
      {isEditable && <title>{`${currentOrganization?.node?.displayName}: Procedures - ${procedure?.name}`}</title>}
      {pendingDraft && <DraftRestoreModal open savedAt={pendingDraft.savedAt} entityLabel="procedure" onResume={restore} onDiscard={discard} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(isEditable ? onSaveHandler : onCreateHandler)} className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1 space-y-6 min-w-0">
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
                    <a className="text-blue-600" href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/policy-and-procedure-management/policies`} target="_blank" rel="noreferrer">
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
                      entity={discussionData?.procedure}
                      clearData={clearData}
                      onClear={() => setClearData(false)}
                      isCreate={!procedure?.id}
                      initialValue={procedure?.detailsJSON ?? procedure?.details ?? form.getValues('detailsJSON') ?? (form.getValues('details') as string) ?? undefined}
                    />
                    {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

            <ProcedureAssociationSection data={procedure ? { id: procedure.id } : undefined} isEditing={isEditable} isCreate={!isEditable} isEditAllowed={true} />
            <div className="flex justify-between items-center">
              <SaveButton disabled={isSubmitting} title={isSubmitting ? (isEditable ? 'Saving' : 'Creating procedure') : isEditable ? 'Save' : 'Save Procedure'} />
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

export default CreateProcedureForm
