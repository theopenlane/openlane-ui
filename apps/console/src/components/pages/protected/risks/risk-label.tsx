import { SquareArrowDown, SquareArrowRight, SquareArrowUpRight, SquareArrowUp, ArrowRightLeft, Wrench, ShieldCheck, Ban } from 'lucide-react'

import { RiskRiskDecision, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { RiskIconMapper } from '@/components/shared/enum-mapper/risk-enum'
import React, { useRef } from 'react'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { type EditRisksFormData } from './view/hooks/use-form-schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { cn } from '@repo/ui/lib/utils'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'

interface RiskLabelProps {
  fieldName?: keyof EditRisksFormData
  score?: number
  impact?: RiskRiskImpact
  likelihood?: RiskRiskLikelihood
  status?: RiskRiskStatus
  riskCategoryName?: string
  riskKindName?: string
  isEditing: boolean
  onChange?: (value: string | number) => void
  onMouseUp?: (value: string | number) => void
  onClose?: () => void
  selectFieldClassname?: string | undefined
  showIcon?: boolean
}

export const RiskLabel = ({
  fieldName,
  score,
  impact,
  likelihood,
  riskCategoryName,
  riskKindName,
  status,
  isEditing,
  onChange,
  onMouseUp,
  onClose,
  selectFieldClassname,
  showIcon = true,
}: RiskLabelProps) => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { enumOptions: riskKindOptions, onCreateOption: createRiskKind } = useCreatableEnumOptions({
    objectType: 'risk',
    field: 'kind',
  })

  const { enumOptions: riskCategoryOptions, onCreateOption: createRiskCategory } = useCreatableEnumOptions({
    objectType: 'risk',
    field: 'category',
  })

  useClickOutsideWithPortal(
    () => {
      if (isEditing) onClose?.()
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: isEditing,
    },
  )

  if (isEditing) {
    if (typeof score === 'number') {
      return (
        <div ref={popoverRef} className="w-full flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={20}
            value={score}
            onChange={(e) => onChange?.(Number(e.target.value))}
            onMouseUp={(e) => onMouseUp?.(Number(e.currentTarget.value))}
            className="accent-brand w-full h-2 bg-input-slider rounded-lg appearance-none cursor-pointer "
          />
          <span className="text-sm w-8 text-right">{score}</span>
        </div>
      )
    }

    if (fieldName === 'impact') {
      return (
        <div ref={triggerRef}>
          <Select value={impact} onValueChange={(val) => onChange?.(val)}>
            <SelectTrigger className={cn('w-30', selectFieldClassname)}>
              <SelectValue className="text-muted-foreground" placeholder="Select impact" />
            </SelectTrigger>
            <SelectContent ref={popoverRef}>
              <SelectItem value={RiskRiskImpact.LOW}>{getEnumLabel(RiskRiskImpact.LOW)}</SelectItem>
              <SelectItem value={RiskRiskImpact.MODERATE}>{getEnumLabel(RiskRiskImpact.MODERATE)}</SelectItem>
              <SelectItem value={RiskRiskImpact.HIGH}>{getEnumLabel(RiskRiskImpact.HIGH)}</SelectItem>
              <SelectItem value={RiskRiskImpact.CRITICAL}>{getEnumLabel(RiskRiskImpact.CRITICAL)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (fieldName === 'likelihood') {
      return (
        <Select value={likelihood} onValueChange={(val) => onChange?.(val)}>
          <SelectTrigger className={cn('w-35', selectFieldClassname)}>
            <SelectValue className="text-muted-foreground" placeholder="Select likelihood" />
          </SelectTrigger>
          <SelectContent ref={popoverRef}>
            <SelectItem value={RiskRiskLikelihood.UNLIKELY}>{getEnumLabel(RiskRiskLikelihood.UNLIKELY)}</SelectItem>
            <SelectItem value={RiskRiskLikelihood.LIKELY}>{getEnumLabel(RiskRiskLikelihood.LIKELY)}</SelectItem>
            <SelectItem value={RiskRiskLikelihood.HIGHLY_LIKELY}>{getEnumLabel(RiskRiskLikelihood.HIGHLY_LIKELY)}</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (fieldName === 'status') {
      return (
        <Select value={status} onValueChange={(v) => onChange?.(v)}>
          <SelectTrigger className={cn('w-35', selectFieldClassname)}>
            <SelectValue className="text-muted-foreground" placeholder="Select status" />
          </SelectTrigger>

          <SelectContent ref={popoverRef}>
            {Object.values(RiskRiskStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {getEnumLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
  }

  if (fieldName === 'riskKindName' && isEditing) {
    return (
      <div ref={triggerRef}>
        <CreatableCustomTypeEnumSelect
          value={riskKindName}
          options={riskKindOptions ?? []}
          onValueChange={(val) => onChange?.(val)}
          onCreateOption={createRiskKind}
          placeholder="Select type"
          searchPlaceholder="Search risk type..."
          triggerClassName={cn('w-40', selectFieldClassname)}
          contentRef={popoverRef}
        />
      </div>
    )
  }

  if (fieldName === 'riskCategoryName' && isEditing) {
    return (
      <div ref={triggerRef}>
        <CreatableCustomTypeEnumSelect
          value={riskCategoryName}
          options={riskCategoryOptions ?? []}
          onValueChange={(val) => onChange?.(val)}
          onCreateOption={createRiskCategory}
          placeholder="Select category"
          searchPlaceholder="Search category..."
          triggerClassName={cn('w-40', selectFieldClassname)}
          contentRef={popoverRef}
        />
      </div>
    )
  }

  // Non-editing display below
  if (typeof score === 'number') {
    return riskScoreStyle(score, showIcon)
  }

  if (impact) {
    return riskImpactStyle(impact, showIcon)
  }

  if (likelihood) {
    return riskLikelihoodStyle(likelihood, showIcon)
  }

  if (status) {
    return (
      <div className="flex gap-2 items-center text-sm">
        {RiskIconMapper[status]}
        {getEnumLabel(status)}
      </div>
    )
  }

  if (fieldName === 'riskKindName') {
    return (
      <div className="text-sm flex items-center">
        <CustomTypeEnumValue value={riskKindName} options={riskKindOptions ?? []} placeholder="-" />
      </div>
    )
  }

  if (fieldName === 'riskCategoryName') {
    return (
      <div className="text-sm flex items-center">
        <CustomTypeEnumValue value={riskCategoryName} options={riskCategoryOptions ?? []} placeholder="-" />
      </div>
    )
  }

  return null
}

export default RiskLabel

export function riskLikelihoodStyle(likelihood: RiskRiskLikelihood, showIcon: boolean): React.ReactNode {
  switch (likelihood) {
    case RiskRiskLikelihood.UNLIKELY:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <SquareArrowDown size={16} strokeWidth={1.5} className="text-green-500" />}
          Unlikely
        </div>
      )
    case RiskRiskLikelihood.LIKELY:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <SquareArrowRight size={16} strokeWidth={1.5} className="text-yellow-500" />}
          Likely
        </div>
      )
    case RiskRiskLikelihood.HIGHLY_LIKELY:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <SquareArrowUp size={16} strokeWidth={1.5} className="text-red-500" />}
          Highly likely
        </div>
      )
    default:
      return null
  }
}

export function riskImpactStyle(impact: RiskRiskImpact, showIcon: boolean): React.ReactNode {
  switch (impact) {
    case RiskRiskImpact.LOW:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <SquareArrowDown size={16} strokeWidth={1.5} className="text-green-500" />}
          Low
        </div>
      )
    case RiskRiskImpact.MODERATE:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <SquareArrowRight size={16} strokeWidth={1.5} className="text-yellow-500" />}
          Moderate
        </div>
      )
    case RiskRiskImpact.HIGH:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <SquareArrowUpRight size={16} strokeWidth={1.5} className="text-orange-500" />}
          High
        </div>
      )
    case RiskRiskImpact.CRITICAL:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <SquareArrowUp size={16} strokeWidth={1.5} className="text-red-500" />}
          Critical
        </div>
      )
    default:
      return null
  }
}

export function riskScoreStyle(score: number, showIcon: boolean): React.ReactNode {
  if (score < 5) {
    return (
      <div className="flex gap-2 items-center text-sm">
        {showIcon && <SquareArrowDown size={16} strokeWidth={1.5} className="text-green-500" />}
        {score}
      </div>
    )
  }

  if (score < 10) {
    return (
      <div className="flex gap-2 items-center text-sm">
        {showIcon && <SquareArrowRight size={16} strokeWidth={1.5} className="text-yellow-500" />}
        {score}
      </div>
    )
  }

  if (score < 15) {
    return (
      <div className="flex gap-2 items-center text-sm">
        {showIcon && <SquareArrowUpRight size={16} strokeWidth={1.5} className="text-orange-500" />}
        {score}
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-center text-sm">
      {showIcon && <SquareArrowUp size={16} strokeWidth={1.5} className="text-red-500" />}
      {score}
    </div>
  )
}

export function riskDecisionStyle(decision: RiskRiskDecision, showIcon: boolean): React.ReactNode {
  switch (decision) {
    case RiskRiskDecision.ACCEPT:
      return (
        <div className=" flex gap-2 items-center text-sm">
          {showIcon && <ShieldCheck size={16} strokeWidth={1.5} className="text-green-500" />}
          Accept
        </div>
      )
    case RiskRiskDecision.AVOID:
      return (
        <div className=" flex gap-2 items-center text-sm">
          {showIcon && <Ban size={16} strokeWidth={1.5} className="text-red-500" />}
          Avoid
        </div>
      )
    case RiskRiskDecision.MITIGATE:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <Wrench size={16} strokeWidth={1.5} className="text-blue-500" />}
          Mitigate
        </div>
      )
    case RiskRiskDecision.TRANSFER:
      return (
        <div className="flex gap-2 items-center text-sm">
          {showIcon && <ArrowRightLeft size={16} strokeWidth={1.5} className="text-purple-500" />}
          Transfer
        </div>
      )
    default:
      return <div className="flex gap-2 items-center text-sm">-</div>
  }
}
