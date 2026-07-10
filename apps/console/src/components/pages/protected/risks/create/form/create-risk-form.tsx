import React, { useState } from 'react'
import { useCreateRisk } from '@/lib/graphql-hooks/risk'
import useFormSchema, { type CreateRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { Form } from '@repo/ui/form'
import PropertiesCard from '@/components/pages/protected/risks/view/cards/properties-card.tsx'
import { type Value } from 'platejs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import BusinessCostField from '@/components/pages/protected/risks/view/fields/business-cost-field.tsx'
import TitleField from '../../view/fields/title-field'
import DetailsField from '@/components/pages/protected/risks/view/fields/details-field.tsx'
import AuthorityCard from '../cards/authority-card'
import TagsCard from '@/components/pages/protected/risks/create/cards/tags-card.tsx'
import { RiskAssociationSection } from '@/components/pages/protected/risks/create/form/fields/association-section'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Switch } from '@repo/ui/switch'
import { RiskFrequency, type RiskRiskDecision } from '@repo/codegen/src/schema'
import { buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

const CreateRiskForm: React.FC = () => {
  const { mutateAsync: createRisk, isPending } = useCreateRisk()
  const router = useRouter()
  const plateEditorHelper = usePlateEditor()

  const { successNotification, errorNotification } = useNotification()
  const { form } = useFormSchema()
  const [createMultiple, setCreateMultiple] = useState(false)
  const [clearData, setClearData] = useState<boolean>(false)

  const onSubmitHandler = async (values: CreateRisksFormData) => {
    const { stakeholder, delegate, ...rest } = values

    const businessCostsField = rest.businessCosts ? await plateEditorHelper.convertToHtml(rest.businessCosts as Value) : undefined

    const detailsJSON = values.detailsJSON ? (values.detailsJSON as Value) : undefined
    const details = values.detailsJSON ? await plateEditorHelper.convertToHtml(values.detailsJSON as Value) : undefined

    try {
      const createdRisk = await createRisk({
        input: {
          ...rest,
          mitigation: undefined,
          details: details,
          detailsJSON: detailsJSON,
          businessCosts: businessCostsField,
          tags: values?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          reviewFrequency: (values.reviewFrequency as RiskFrequency) || RiskFrequency.YEARLY,
          riskDecision: (values.riskDecision as RiskRiskDecision) || undefined,
          ...buildResponsibilityPayload('stakeholder', stakeholder),
          ...buildResponsibilityPayload('delegate', delegate),
        },
      })

      successNotification({
        title: 'Risk created',
        description: 'The risk was successfully created.',
      })
      if (createMultiple) {
        setClearData(true)
        const { name: _name, businessCosts: _businessCosts, details: _details, detailsJSON: _detailsJSON, stakeholder: _stakeholder, delegate: _delegate, ...preserved } = values
        form.reset({
          ...preserved,
          name: '',
          businessCosts: values.businessCosts,
          stakeholder: stakeholder ? { ...stakeholder, noClearOtherFields: true } : undefined,
          delegate: delegate ? { ...delegate, noClearOtherFields: true } : undefined,
        })
      } else {
        router.push(`/exposure/risks/${createdRisk.createRisk.risk.id}`)
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
        <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6">
          <div className="space-y-6 w-full max-w-full overflow-hidden">
            <TitleField isEditing={true} form={form} />
            <DetailsField isEditing={true} clearData={clearData} onCleared={() => setClearData(false)} isCreate={true} />
            <BusinessCostField isEditing={true} clearData={clearData} onCleared={() => setClearData(false)} isCreate={true} />
            <RiskAssociationSection isEditing={false} isCreate={true} isEditAllowed={true} />
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
            <AuthorityCard />
            <PropertiesCard form={form} isEditing={true} isCreate={true} />
            <TagsCard form={form} />
          </div>
        </form>
      </Form>
    </>
  )
}

export default CreateRiskForm
