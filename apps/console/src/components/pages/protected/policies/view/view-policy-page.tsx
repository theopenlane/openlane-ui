import { Loading } from '@/components/shared/loading/loading'
import { useGetInternalPolicyDetailsById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import React, { useEffect, useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import useFormSchema, { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { Form } from '@repo/ui/form'
import DetailsField from '@/components/pages/protected/policies/view/fields/details-field.tsx'
import TitleField from '@/components/pages/protected/policies/view/fields/title-field.tsx'
import { Button } from '@repo/ui/button'
import { PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import AuthorityCard from '@/components/pages/protected/policies/view/cards/authority-card.tsx'
import PropertiesCard from '@/components/pages/protected/policies/view/cards/properties-card.tsx'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency, UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import HistoricalCard from '@/components/pages/protected/policies/view/cards/historical-card.tsx'
import TagsCard from '@/components/pages/protected/policies/view/cards/tags-card.tsx'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { Value } from '@udecode/plate-common'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'
import { usePolicy } from '@/components/pages/protected/policies/create/hooks/use-policy.tsx'
import AssociatedObjectsViewAccordion from '@/components/pages/protected/policies/accordion/associated-objects-view-accordion.tsx'
import AssociationCard from '@/components/pages/protected/policies/create/cards/association-card.tsx'

type TViewPolicyPage = {
  policyId: string
}

const ViewPolicyPage: React.FC<TViewPolicyPage> = ({ policyId }) => {
  const { data, isLoading } = useGetInternalPolicyDetailsById(policyId)
  const plateEditorHelper = usePlateEditor()
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()
  const associationsState = usePolicy((state) => state.associations)
  const policyState = usePolicy()
  const policy = data?.internalPolicy
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const [initialAssociations, setInitialAssociations] = useState<TObjectAssociationMap>({})
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

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
        procedureIDs: policy?.procedures?.edges?.map((item) => item?.node?.displayID!) || [],
        programIDs: policy?.programs?.edges?.map((item) => item?.node?.displayID!) || [],
        controlObjectiveIDs: policy?.controlObjectives?.edges?.map((item) => item?.node?.displayID!) || [],
        taskIDs: policy?.tasks?.edges?.map((item) => item?.node?.displayID!) || [],
      }

      form.reset({
        name: policy.name,
        details: policy?.details ?? '',
        tags: policy.tags ?? [],
        approvalRequired: policy?.approvalRequired ?? true,
        status: policy.status ?? InternalPolicyDocumentStatus.DRAFT,
        policyType: policy.policyType ?? '',
        reviewDue: policy.reviewDue ? new Date(policy.reviewDue as string) : undefined,
        reviewFrequency: policy.reviewFrequency ?? InternalPolicyFrequency.YEARLY,
        approverID: policy.approver?.id,
        delegateID: policy.delegate?.id,
      })

      setInitialAssociations(policyAssociations)
      policyState.setAssociations(policyAssociations)
      policyState.setAssociationRefCodes(policyAssociationsRefCodes)
    }
  }, [policy])

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset()
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
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

  const onSubmitHandler = async (data: EditPolicyMetadataFormData) => {
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
          approverID: data.approverID || undefined,
          delegateID: data.delegateID || undefined,
          ...associationInputs,
        },
      }

      await updatePolicy(formData)

      successNotification({
        title: 'Policy Updated',
        description: 'Policy has been successfully updated',
      })

      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      queryClient.invalidateQueries({ queryKey: ['internalPolicy', policy?.id!] })
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error updating the policy. Please try again.',
      })
    }
  }

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && policy && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
            <div className="space-y-6">
              <TitleField isEditing={isEditing} form={form} />
              <DetailsField isEditing={isEditing} form={form} policy={policy} />
              <AssociatedObjectsViewAccordion policy={policy} />
            </div>
            <div className="space-y-4">
              {isEditing ? (
                <div className="flex gap-2 justify-end">
                  <Button className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
                    Cancel
                  </Button>
                  <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />} disabled={isSaving}>
                    {isSaving ? 'Saving' : 'Save'}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 justify-end">
                  <Button className="h-8 !px-2" icon={<PencilIcon />} iconPosition="left" onClick={handleEdit}>
                    Edit Policy
                  </Button>
                </div>
              )}
              <AuthorityCard form={form} approver={policy.approver} delegate={policy.delegate} isEditing={isEditing} />
              <PropertiesCard form={form} isEditing={isEditing} policy={policy} />
              <HistoricalCard policy={policy} />
              <TagsCard form={form} policy={policy} isEditing={isEditing} />
              <AssociationCard isEditable={isEditing} />
            </div>
          </form>
        </Form>
      )}
    </>
  )
}

export default ViewPolicyPage
