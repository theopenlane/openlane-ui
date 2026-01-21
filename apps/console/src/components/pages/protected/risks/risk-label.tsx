import { SquareArrowDown, SquareArrowRight, SquareArrowUpRight, SquareArrowUp } from 'lucide-react'

import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { RiskIconMapper } from '@/components/shared/enum-mapper/risk-enum'
import { useRef } from 'react'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { EditRisksFormData } from './view/hooks/use-form-schema'
import { formatEnumLabel } from '@/utils/enumToLabel'
import { cn } from '@repo/ui/lib/utils'
import CustomTypeEnumChip from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

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
}

export const RiskLabel = ({ fieldName, score, impact, likelihood, riskCategoryName, riskKindName, status, isEditing, onChange, onMouseUp, onClose, selectFieldClassname }: RiskLabelProps) => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { enumOptions: riskKindOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'kind',
    },
  })

  const { enumOptions: riskCategoryOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'category',
    },
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

    if (impact) {
      return (
        <div ref={triggerRef}>
          <Select value={impact} onValueChange={(val) => onChange?.(val)}>
            <SelectTrigger className={cn('w-[120px]', selectFieldClassname)}>
              <SelectValue placeholder="Select impact" />
            </SelectTrigger>
            <SelectContent ref={popoverRef}>
              <SelectItem value={RiskRiskImpact.LOW}>Low</SelectItem>
              <SelectItem value={RiskRiskImpact.MODERATE}>Medium</SelectItem>
              <SelectItem value={RiskRiskImpact.HIGH}>High</SelectItem>
              <SelectItem value={RiskRiskImpact.CRITICAL}>Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (likelihood) {
      return (
        <Select value={likelihood} onValueChange={(val) => onChange?.(val)}>
          <SelectTrigger className={cn('w-[140px]', selectFieldClassname)}>
            <SelectValue placeholder="Select likelihood" />
          </SelectTrigger>
          <SelectContent ref={popoverRef}>
            <SelectItem value={RiskRiskLikelihood.UNLIKELY}>Unlikely</SelectItem>
            <SelectItem value={RiskRiskLikelihood.LIKELY}>Likely</SelectItem>
            <SelectItem value={RiskRiskLikelihood.HIGHLY_LIKELY}>Highly likely</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (status) {
      return (
        <Select value={status} onValueChange={(v) => onChange?.(v)}>
          <SelectTrigger className={cn('w-[140px]', selectFieldClassname)}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>

          <SelectContent ref={popoverRef}>
            {Object.values(RiskRiskStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {formatEnumLabel(s)}
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
        <Select value={riskKindName} onValueChange={(val) => onChange?.(val)}>
          <SelectTrigger className={cn('w-40', selectFieldClassname)}>
            <SelectValue placeholder="Select risk type" />
          </SelectTrigger>

          <SelectContent ref={popoverRef}>
            {riskKindOptions?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <CustomTypeEnumChip option={opt} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (fieldName === 'riskCategoryName' && isEditing) {
    return (
      <div ref={triggerRef}>
        <Select value={riskCategoryName} onValueChange={(val) => onChange?.(val)}>
          <SelectTrigger className={cn('w-40', selectFieldClassname)}>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>

          <SelectContent ref={popoverRef}>
            {riskCategoryOptions?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <CustomTypeEnumChip option={opt} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Non-editing display below

  if (typeof score === 'number') {
    if (score < 5) {
      return (
        <div className="text-green-500 flex gap-2 items-center text-sm">
          <SquareArrowDown size={16} strokeWidth={1.5} />
          {score}
        </div>
      )
    } else if (score < 10) {
      return (
        <div className="text-yellow-500 flex gap-2 items-center text-sm">
          <SquareArrowRight size={16} strokeWidth={1.5} />
          {score}
        </div>
      )
    } else if (score < 15) {
      return (
        <div className="text-orange-500 flex gap-2 items-center text-sm">
          <SquareArrowUpRight size={16} strokeWidth={1.5} />
          {score}
        </div>
      )
    } else {
      return (
        <div className="text-red-500 flex gap-2 items-center text-sm">
          <SquareArrowUp size={16} strokeWidth={1.5} />
          {score}
        </div>
      )
    }
  }

  if (impact) {
    switch (impact) {
      case RiskRiskImpact.LOW:
        return (
          <div className="text-green-500 flex gap-2 items-center text-sm">
            <SquareArrowDown size={16} strokeWidth={1.5} />
            Low
          </div>
        )
      case RiskRiskImpact.MODERATE:
        return (
          <div className="text-yellow-500 flex gap-2 items-center text-sm">
            <SquareArrowRight size={16} strokeWidth={1.5} />
            Medium
          </div>
        )
      case RiskRiskImpact.HIGH:
        return (
          <div className="text-orange-500 flex gap-2 items-center text-sm">
            <SquareArrowUpRight size={16} strokeWidth={1.5} />
            High
          </div>
        )
      case RiskRiskImpact.CRITICAL:
        return (
          <div className="text-red-500 flex gap-2 items-center text-sm">
            <SquareArrowUp size={16} strokeWidth={1.5} />
            Critical
          </div>
        )
    }
  }

  if (likelihood) {
    switch (likelihood) {
      case RiskRiskLikelihood.UNLIKELY:
        return (
          <div className="text-green-500 flex gap-2 items-center text-sm">
            <SquareArrowDown size={16} strokeWidth={1.5} />
            Unlikely
          </div>
        )
      case RiskRiskLikelihood.LIKELY:
        return (
          <div className="text-yellow-500 flex gap-2 items-center text-sm">
            <SquareArrowRight size={16} strokeWidth={1.5} />
            Likely
          </div>
        )
      case RiskRiskLikelihood.HIGHLY_LIKELY:
        return (
          <div className="text-red-500 flex gap-2 items-center text-sm">
            <SquareArrowUp size={16} strokeWidth={1.5} />
            Highly likely
          </div>
        )
    }
  }

  if (status) {
    return (
      <div className="flex gap-2 items-center text-sm">
        {RiskIconMapper[status]}
        {formatEnumLabel(status)}
      </div>
    )
  }

  if (fieldName === 'riskKindName') {
    return <div className="text-sm flex items-center">{riskKindName || '-'}</div>
  }

  if (fieldName === 'riskCategoryName') {
    return <div className="text-sm flex items-center">{riskCategoryName || '-'}</div>
  }

  return null
}

export default RiskLabel
