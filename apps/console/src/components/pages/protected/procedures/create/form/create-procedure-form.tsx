'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from 'platejs'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { CreateProcedureInput, ProcedureByIdFragment, ProcedureDocumentStatus, ProcedureFrequency, UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema, { CreateProcedureFormData } from '../hooks/use-form-schema'
import StatusCard from '@/components/pages/protected/procedures/create/cards/status-card.tsx'
import AssociationCard from '@/components/pages/protected/procedures/create/cards/association-card.tsx'
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
import { getAssociationInput } from '@/components/shared/object-association/utils'

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
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { mutateAsync: createProcedure, isPending: isCreating } = useCreateProcedure()
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()
  const isSubmitting = isCreating || isSaving
  const { successNotification, errorNotification } = useNotification()
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [initialAssociations, setInitialAssociations] = useState<TObjectAssociationMap>({})
  const [associationRefCodes, setAssociationRefCodes] = useState<TObjectAssociationMap>({
    taskIDs: [],
    controlIDs: [],
    internalPolicyIDs: [],
    programIDs: [],
    riskIDs: [],
  })
  const metadata = useMemo<TMetadata | undefined>(
    () =>
      procedure
        ? {
            createdAt: procedure.createdAt,
            updatedAt: procedure.updatedAt,
            revision: procedure?.revision ?? '',
          }
        : undefined,
    [procedure],
  )
  const isEditable = !!procedure
  const searchParams = useSearchParams()
  const policyId = searchParams.get('policyId')
  const { data } = useGetInternalPolicyDetailsById(policyId)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [createMultiple, setCreateMultiple] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)

  const { data: assocData } = useGetProcedureAssociationsById(procedure?.id || null)
  const { data: discussionData } = useGetProcedureDiscussionById(procedure?.id || null)
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const plateEditorHelper = usePlateEditor()

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Procedures', href: '/procedures' },
    ])
  }, [setCrumbs])

  const [prevAssocData, setPrevAssocData] = useState(assocData)
  if (procedure && assocData && assocData !== prevAssocData) {
    setPrevAssocData(assocData)
    const procedureAssociations: TObjectAssociationMap = {
      controlIDs: assocData.procedure?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
      internalPolicyIDs: assocData.procedure?.internalPolicies?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
      programIDs: assocData.procedure?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
      risks: assocData.procedure?.risks?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
      taskIDs: assocData.procedure?.tasks?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
    }

    const procedureAssociationsRefCodes: TObjectAssociationMap = {
      controlIDs: assocData.procedure?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => typeof id === 'string') || [],
      internalPolicyIDs: assocData.procedure?.internalPolicies?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
      programIDs: assocData.procedure?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
      risks: assocData.procedure?.risks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
      taskIDs: assocData.procedure?.tasks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
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
    })

    setInitialAssociations(procedureAssociations)
    setAssociations(procedureAssociations)
    setAssociationRefCodes(procedureAssociationsRefCodes)
  }

  const [policyDataLoaded, setPolicyDataLoaded] = useState(false)
  if (data && !policyDataLoaded && Object.keys(associations).length === 0) {
    const procedureAssociations: TObjectAssociationMap = {
      internalPolicyIDs: data?.internalPolicy?.id ? [data.internalPolicy.id] : [],
    }
    const procedureAssociationsRefCodes: TObjectAssociationMap = {
      internalPolicyIDs: data?.internalPolicy?.displayID ? [data.internalPolicy.displayID] : [],
    }
    setInitialAssociations(procedureAssociations)
    setAssociations(procedureAssociations)
    setAssociationRefCodes((prev) => ({ ...prev, ...procedureAssociationsRefCodes }))
    setPolicyDataLoaded(true)
  }

  const handleAssociationsChange = useCallback((newAssociations: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => {
    setAssociations(newAssociations)
    setAssociationRefCodes(newRefCodes)
  }, [])

  const onCreateHandler = async (data: CreateProcedureFormData) => {
    try {
      const formData: { input: CreateProcedureInput } = {
        input: {
          ...data,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associations,
        },
      }

      const createdProcedure = await createProcedure(formData)
      successNotification({
        title: 'Procedure Created',
        description: 'Procedure has been successfully created',
      })

      if (createMultiple) {
        setClearData(true)
        form.reset({
          name: '',
          details: '',
          approvalRequired: data.approvalRequired,
          status: data.status,
          procedureKindName: data?.procedureKindName,
          reviewDue: data.reviewDue,
          reviewFrequency: data.reviewFrequency,
          approverID: data.approverID,
          delegateID: data.delegateID,
          tags: data.tags ?? [],
          ...associations,
        })
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
      const associationInputs = getAssociationInput(initialAssociations, associations)

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
                      onChange={handleDetailsChange}
                      userData={userData}
                      entity={discussionData?.procedure}
                      clearData={clearData}
                      onClear={() => setClearData(false)}
                      isCreate={!procedure?.id}
                      initialValue={procedure?.detailsJSON ?? procedure?.details ?? (form.getValues('details') as string) ?? undefined}
                    />
                    {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

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
            <AssociationCard associations={associations} initialAssociations={initialAssociations} associationRefCodes={associationRefCodes} onAssociationsChange={handleAssociationsChange} />
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreateProcedureForm
