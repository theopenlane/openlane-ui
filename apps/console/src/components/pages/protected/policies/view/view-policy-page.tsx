import { Loading } from '@/components/shared/loading/loading'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy.ts'
import React, { useEffect, useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import AssociatedObjectsViewAccordion from '@/components/pages/protected/policies/associated-objects-view-accordion.tsx'
import useFormSchema, { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { Form } from '@repo/ui/form'
import DetailsField from '@/components/pages/protected/policies/view/fields/details-field.tsx'
import TitleField from '@/components/pages/protected/policies/view/fields/title-field.tsx'
import { Button } from '@repo/ui/button'
import { PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import AuthorityCard from '@/components/pages/protected/policies/view/cards/authority-card.tsx'
import PropertiesCard from '@/components/pages/protected/policies/view/cards/properties-card.tsx'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency } from '@repo/codegen/src/schema.ts'
import HistoricalCard from '@/components/pages/protected/policies/view/cards/historical-card.tsx'
import TagsCard from '@/components/pages/protected/policies/view/cards/tags-card.tsx'
import AssociationCard from '@/components/pages/protected/policies/cards/association-card.tsx'

type TViewPolicyPage = {
  policyId: string
}

const ViewPolicyPage: React.FC<TViewPolicyPage> = ({ policyId }) => {
  const { data, isLoading } = useGetInternalPolicyDetailsById(policyId)
  const plateEditorHelper = usePlateEditor()
  const policy = data?.internalPolicy
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  console.log(policy)

  useEffect(() => {
    if (policy) {
      form.reset({
        name: policy.name,
        details: policy?.details ?? '',
        tags: policy.tags ?? [],
        approvalRequired: policy?.approvalRequired ?? true,
        status: policy.status ?? InternalPolicyDocumentStatus.DRAFT,
        policyType: policy.policyType ?? '',
        reviewDue: policy.reviewDue ? new Date(policy.reviewDue as string) : undefined,
        reviewFrequency: policy.reviewFrequency ?? InternalPolicyFrequency.YEARLY,
      })
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

  const onSubmitHandler = (data: EditPolicyMetadataFormData) => {}

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && policy && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
            <div className="space-y-6">
              <TitleField isEditing={isEditing} form={form} />
              <DetailsField isEditing={isEditing} form={form} />
              <AssociatedObjectsViewAccordion policy={policy} />
            </div>
            <div className="space-y-4">
              {isEditing ? (
                <div className="flex gap-2 justify-end">
                  <Button className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
                    Cancel
                  </Button>
                  <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />}>
                    Save
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
              <AssociationCard />
            </div>
          </form>
        </Form>
      )}
    </>
  )
}

export default ViewPolicyPage
