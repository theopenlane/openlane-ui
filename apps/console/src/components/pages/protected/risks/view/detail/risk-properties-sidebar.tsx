'use client'

import React, { useMemo, useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { type UpdateRiskInput, type GetRiskByIdQuery, RiskRiskStatus, RiskFrequency, RiskRiskDecision, type RiskRiskLikelihood } from '@repo/codegen/src/schema'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { formatDate } from '@/utils/date'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { type EditRisksFormData } from '../hooks/use-form-schema'
import { UserRound, UserRoundCheck, Binoculars, Maximize2, Radio, CalendarDays, RefreshCw, Tag, CircleHelp, Activity, ShieldCheck } from 'lucide-react'
import { RiskIconMapper, RiskLikelihoodOptions } from '@/components/shared/enum-mapper/risk-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { riskDecisionStyle, riskLikelihoodStyle } from '../../risk-label'

const iconClass = 'h-4 w-4 text-muted-foreground'

interface RiskPropertiesSidebarProps {
  data: GetRiskByIdQuery['risk']
  isEditing: boolean
  handleUpdate: (input: UpdateRiskInput) => Promise<void>
  canEdit: boolean
}

const RiskPropertiesSidebar: React.FC<RiskPropertiesSidebarProps> = ({ data, isEditing, handleUpdate, canEdit: canEditRisk }) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const { control, watch, setValue } = useFormContext<EditRisksFormData>()

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const { tagOptions } = useGetTags()

  const tags = watch('tags')
  const tagValues = useMemo(() => {
    return (tags ?? []).filter((item: string | undefined): item is string => typeof item === 'string').map((item: string) => ({ value: item, label: item }))
  }, [tags])

  const reviewRequired = watch('reviewRequired')

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const blurTags = () => {
    const current = data?.tags || []
    const next = tagValues.map((item: { value: string; label: string }) => item.value)
    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed) {
      setValue('tags', next)
      handleUpdate({ tags: next })
    }
  }

  useClickOutsideWithPortal(
    () => {
      setInternalEditing(null)
      if (internalEditing === 'tags') {
        blurTags()
      }
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: internalEditing === 'tags',
    },
  )

  useEscapeKey(
    () => {
      if (internalEditing === 'tags') {
        const options: Option[] = (data?.tags ?? []).filter((item: string): item is string => typeof item === 'string').map((item: string) => ({ value: item, label: item }))
        setValue(
          'tags',
          options.map((opt) => opt.value),
        )
        setInternalEditing(null)
      }
    },
    { enabled: internalEditing === 'tags' },
  )

  const riskStatusOptions = enumToOptions(RiskRiskStatus)
  const reviewFrequencyOptions = enumToOptions(RiskFrequency)
  const riskDecisionOptions = enumToOptions(RiskRiskDecision)

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEditRisk,
    isCreate: false,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground w-30',
  }

  return (
    <>
      <Card className="p-4 bg-card rounded-xl shadow-xs">
        <h3 className="text-lg font-medium mb-4">Owners</h3>
        <div className="flex flex-col gap-3">
          <ResponsibilityField name="stakeholder" fieldBaseName="stakeholder" label="Stakeholder" icon={<UserRound className={iconClass} />} {...sharedFieldProps} groupOnly={true} />

          <ResponsibilityField name="delegate" fieldBaseName="delegate" label="Delegate" icon={<UserRoundCheck className={iconClass} />} groupOnly={true} {...sharedFieldProps} />
        </div>
      </Card>
      <Card className="p-4 bg-card rounded-xl shadow-xs">
        <h3 className="text-lg font-medium mb-4">Impact</h3>
        <div className="flex flex-col gap-3">
          {data?.residualScore !== null && data?.residualScore !== 0 ? (
            <>
              <div>
                <TextField type="number" name="residualScore" label="Residual Score" icon={<Activity className={iconClass} />} {...sharedFieldProps} />
              </div>
              <div>
                <TextField type="number" name="score" label="Original Score" icon={<ShieldCheck className={iconClass} />} {...sharedFieldProps} />
              </div>
            </>
          ) : (
            <div>
              <TextField type="number" name="score" label="Score" className="" icon={<ShieldCheck className={iconClass} />} {...sharedFieldProps} />
            </div>
          )}
          <SelectField
            name="likelihood"
            label="Likelihood"
            options={RiskLikelihoodOptions}
            {...sharedFieldProps}
            icon={<CircleHelp className={iconClass} />}
            renderValue={(value) => (
              <div className="flex items-center space-x-2 text-sm">
                <span>{riskLikelihoodStyle(value as RiskRiskLikelihood, true)}</span>
              </div>
            )}
          />

          {isEditing || (data?.riskDecision && data.riskDecision !== RiskRiskDecision.NONE) ? (
            <SelectField
              name="riskDecision"
              label="Decision"
              icon={<Binoculars className={iconClass} />}
              options={riskDecisionOptions}
              useCustomDisplay={false}
              renderValue={(value) => (
                <div className="flex items-center space-x-2 text-sm">
                  <span>{riskDecisionStyle(value as RiskRiskDecision, true)}</span>
                </div>
              )}
              {...sharedFieldProps}
            />
          ) : null}
        </div>
      </Card>

      <Card className="p-4 bg-card rounded-xl shadow-xs">
        <h3 className="text-lg font-medium mb-4">Details</h3>
        <div className="flex flex-col gap-3">
          <SelectField
            name="status"
            label="Status"
            icon={<Binoculars className={iconClass} />}
            options={riskStatusOptions}
            useCustomDisplay={false}
            renderValue={(value) => (
              <div className="flex items-center space-x-2 text-sm">
                {RiskIconMapper[value as RiskRiskStatus]}
                <span>{getEnumLabel(value)}</span>
              </div>
            )}
            {...sharedFieldProps}
          />

          {isEditing && (
            <>
              <div className="flex items-center gap-2 shrink-0 mb-4 mt-2">
                <h3 className="text-lg font-medium pr-20">Review</h3>
                <CheckboxField name="reviewRequired" label="Review Required?" {...sharedFieldProps} />
              </div>
            </>
          )}

          {reviewRequired && (
            <>
              <SelectField name="reviewFrequency" label="Frequency" icon={<RefreshCw className={iconClass} />} options={reviewFrequencyOptions} {...sharedFieldProps} />

              <TextField name="nextReviewDueAt" label="Next Review" icon={<CalendarDays className={iconClass} />} type="date" {...sharedFieldProps} />
            </>
          )}

          {!isEditing && reviewRequired && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <CalendarDays className={iconClass} />
                  <span className="text-base text-muted-foreground">Last Reviewed</span>
                </div>
                <span className="text-sm py-2 px-1">{formatDate(data?.lastReviewedAt)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <CalendarDays className={iconClass} />
                  <span className="text-base text-muted-foreground">Mitigated At</span>
                </div>
                <span className="text-sm py-2 px-1">{formatDate(data?.mitigatedAt)}</span>
              </div>
            </>
          )}

          <SelectField name="environmentName" label="Environment" icon={<Maximize2 className={iconClass} />} options={environmentOptions} onCreateOption={createEnvironment} {...sharedFieldProps} />

          <SelectField name="scopeName" label="Scope" icon={<Radio className={iconClass} />} options={scopeOptions} onCreateOption={createScope} {...sharedFieldProps} />

          <div className={`flex ${isEditing || internalEditing === 'tags' ? 'flex-col gap-2' : 'items-center justify-between gap-4'}`}>
            <div className="flex items-center gap-2 shrink-0">
              <Tag className={iconClass} />
              <span className="text-base text-muted-foreground">Tags</span>
            </div>

            <div ref={triggerRef} className="w-full">
              {isEditing || internalEditing === 'tags' ? (
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <MultipleSelector
                      options={tagOptions}
                      hideClearAllButton
                      className="w-full"
                      placeholder="Add tag..."
                      creatable
                      value={tagValues}
                      onChange={(selectedOptions) => {
                        const newTags = selectedOptions.map((opt) => opt.value)
                        field.onChange(newTags)
                      }}
                    />
                  )}
                />
              ) : (
                <div className={`text-sm py-2 rounded-md px-1 w-full hover:bg-accent ${canEditRisk ? 'cursor-pointer' : ''}`} onClick={() => canEditRisk && !isEditing && setInternalEditing('tags')}>
                  {data?.tags?.length ? (
                    <div className="flex gap-2 flex-wrap justify-end">
                      {data.tags.map((tag) => (
                        <TagChip key={tag} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No tags</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}

export default RiskPropertiesSidebar
