'use client'

import React, { useCallback } from 'react'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ExternalLink, PanelRightClose } from 'lucide-react'
import useFormSchema, { type EditRisksFormData } from './view/hooks/use-form-schema'
import { type RiskFieldsFragment, type UpdateRiskInput, type CreateRiskInput, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { useGetRiskById } from '@/lib/graphql-hooks/risk'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import TitleField from './view/fields/title-field'
import DetailsField from './view/fields/details-field'
import PropertiesCard from './view/cards/properties-card'
import { type Value } from 'platejs'
import { GenericDetailsSheet, type GenericDetailsSheetConfig, type RenderFieldsProps, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewRiskSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const router = useRouter()
  const { form } = useFormSchema()
  const { data, isLoading } = useGetRiskById(entityId)
  const plateEditorHelper = usePlateEditor()

  const getName = useCallback((d: RiskFieldsFragment) => d?.name, [])

  const normalizeData = useCallback(
    (d: RiskFieldsFragment): Partial<EditRisksFormData> => ({
      name: d.name ?? '',
      riskKindName: d.riskKindName ?? undefined,
      riskCategoryName: d.riskCategoryName ?? undefined,
      score: d.score ?? 0,
      impact: d.impact ?? RiskRiskImpact.LOW,
      likelihood: d.likelihood ?? RiskRiskLikelihood.UNLIKELY,
      status: d.status ?? RiskRiskStatus.IDENTIFIED,
      details: d.details ?? '',
      detailsJSON: (d.detailsJSON as Value) ?? undefined,
      mitigation: d.mitigation ?? '',
      businessCosts: d.businessCosts ?? '',
      tags: d.tags || [],
      stakeholderID: d.stakeholder?.id,
      delegateID: d.delegate?.id,
    }),
    [],
  )

  const buildPayload = useCallback(
    async (values: EditRisksFormData): Promise<UpdateRiskInput | CreateRiskInput> => {
      const details = values.detailsJSON ? await plateEditorHelper.convertToHtml(values.detailsJSON as Value) : (values.details as string | undefined)
      const businessCosts = values.businessCosts ? await plateEditorHelper.convertToHtml(values.businessCosts as Value) : undefined
      const mitigation = values.mitigation ? await plateEditorHelper.convertToHtml(values.mitigation as Value) : undefined

      return {
        name: values.name,
        riskKindName: values.riskKindName,
        riskCategoryName: values.riskCategoryName,
        score: values.score,
        impact: values.impact,
        likelihood: values.likelihood,
        status: values.status,
        details,
        detailsJSON: values.detailsJSON,
        businessCosts,
        mitigation,
        tags: values.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
        stakeholderID: values.stakeholderID || undefined,
        delegateID: values.delegateID || undefined,
      }
    },
    [plateEditorHelper],
  )

  const renderHeader = useCallback(
    ({ close }: RenderHeaderProps) => (
      <SheetHeader>
        <SheetTitle className="sr-only">Risk</SheetTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PanelRightClose size={16} className="cursor-pointer" onClick={close} />
          </div>
          <div className="flex items-center gap-2 mr-6">
            <Button
              variant="secondary"
              icon={<ExternalLink />}
              iconPosition="left"
              onClick={() => {
                if (entityId) router.push(`/exposure/risks/${entityId}`)
              }}
            >
              Open Full
            </Button>
          </div>
        </div>
      </SheetHeader>
    ),
    [entityId, router],
  )

  const renderFields = useCallback(
    ({ isEditing, isCreate, data: risk, handleUpdateField, isEditAllowed }: RenderFieldsProps<RiskFieldsFragment, UpdateRiskInput>) => {
      return (
        <div className="space-y-6">
          <TitleField isEditing={isEditing} isEditAllowed={isEditAllowed} form={form} initialValue={risk?.name} handleUpdate={(val) => handleUpdateField(val)} />
          <PropertiesCard form={form} risk={risk} isEditing={isEditing} isEditAllowed={isEditAllowed} handleUpdate={(val) => handleUpdateField(val)} isCreate={isCreate} />
          <DetailsField isEditing={isEditing} isEditAllowed={isEditAllowed} form={form} risk={risk} isCreate={isCreate} />
        </div>
      )
    },
    [form],
  )

  const sheetConfig: GenericDetailsSheetConfig<EditRisksFormData, RiskFieldsFragment, UpdateRiskInput, unknown, CreateRiskInput, unknown> = {
    objectType: ObjectTypes.RISK,
    form,
    entityId,
    isCreateMode: false,
    basePath: '/exposure/risks',
    data: entityId ? data?.risk : undefined,
    isFetching: isLoading,
    onClose,
    buildPayload,
    normalizeData,
    getName,
    renderFields,
    renderHeader,
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewRiskSheet
