import React, { useState } from 'react'
import { useCreateRisk } from '@/lib/graphql-hooks/risks.ts'
import useFormSchema, { CreateRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { Form } from '@repo/ui/form'
import PropertiesCard from '@/components/pages/protected/risks/view/cards/properties-card.tsx'
import { Value } from 'platejs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import BusinessCostField from '@/components/pages/protected/risks/view/fields/business-cost-field.tsx'
import { useRisk } from '@/components/pages/protected/risks/create/hooks/use-risk.tsx'
import TitleField from '../../view/fields/title-field'
import DetailsField from '@/components/pages/protected/risks/view/fields/details-field.tsx'
import AuthorityCard from '../cards/authority-card'
import TagsCard from '@/components/pages/protected/risks/create/cards/tags-card.tsx'
import AssociationCard from '@/components/pages/protected/risks/create/cards/association-card.tsx'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Switch } from '@repo/ui/switch'

const CreateRiskForm: React.FC = () => {
  const { mutateAsync: createRisk, isPending } = useCreateRisk()
  const router = useRouter()
  const plateEditorHelper = usePlateEditor()
  const associationsState = useRisk((state) => state.associations)

  const { successNotification, errorNotification } = useNotification()
  const { form } = useFormSchema()
  const [createMultiple, setCreateMultiple] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)

  const onSubmitHandler = async (values: CreateRisksFormData) => {
    let businessCostsField = values?.businessCosts

    if (businessCostsField) {
      businessCostsField = await plateEditorHelper.convertToHtml(businessCostsField as Value)
    }

    try {
      const createdRisk = await createRisk({
        input: {
          ...values,
          mitigation: undefined,
          details: await plateEditorHelper.convertToHtml(values.detailsJSON as Value),
          detailsJSON: values.detailsJSON,
          businessCosts: businessCostsField,
          tags: values?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          stakeholderID: values.stakeholderID || undefined,
          delegateID: values.delegateID || undefined,
          ...associationsState,
        },
      })

      successNotification({
        title: 'Risk created',
        description: 'The risk was successfully created.',
      })
      if (createMultiple) {
        setClearData(true)
        form.reset({
          name: '',
          businessCosts: values.businessCosts,
          stakeholderID: values.stakeholderID,
          delegateID: values.delegateID,
          tags: values.tags ?? [],
          score: values.score,
          status: values.status,
          likelihood: values.likelihood,
          riskKindName: values.riskKindName,
          riskCategoryName: values.riskCategoryName,
          ...associationsState,
        })
      } else {
        router.push(`/risks/${createdRisk.createRisk.risk.id}`)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
          <div className="space-y-6 w-full max-w-full overflow-hidden">
            <TitleField isEditing={true} form={form} />
            <DetailsField isEditing={true} form={form} clearData={clearData} onCleared={() => setClearData(false)} isCreate={true} />
            <BusinessCostField isEditing={true} form={form} />
            <div className="flex justify-between items-center">
              <Button variant="primary" type="submit" disabled={isPending}>
                {isPending ? 'Creating risk' : 'Create risk'}
              </Button>
              <div className="flex items-center gap-2">
                <Switch checked={createMultiple} onCheckedChange={setCreateMultiple} />
                <span>Create multiple</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <AuthorityCard form={form} />
            <PropertiesCard form={form} isEditing={true} isCreate={true} />
            <AssociationCard />
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreateRiskForm
