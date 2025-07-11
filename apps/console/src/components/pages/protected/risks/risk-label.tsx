import { SquareArrowDown, SquareArrowRight, SquareArrowUpRight, SquareArrowUp } from 'lucide-react'

import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { RiskIconMapper } from '@/components/shared/icon-enum/risk-enum.tsx'
import { RisksStatusMapper } from '@/components/pages/protected/risks/risks.ts'

interface RiskLabelProps {
  score?: number
  impact?: RiskRiskImpact
  likelihood?: RiskRiskLikelihood
  status?: RiskRiskStatus
  isEditing: boolean
  onChange?: (value: string | number) => void
}

export const RiskLabel = ({ score, impact, likelihood, status, isEditing, onChange }: RiskLabelProps) => {
  if (isEditing) {
    if (typeof score === 'number') {
      return (
        <div className="w-full flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={20}
            value={score}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="accent-brand w-full h-2 bg-input-slider rounded-lg appearance-none cursor-pointer "
          />
          <span className="text-sm w-8 text-right">{score}</span>
        </div>
      )
    }

    if (impact) {
      return (
        <Select value={impact} onValueChange={(val) => onChange?.(val)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select impact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RiskRiskImpact.LOW}>Low</SelectItem>
            <SelectItem value={RiskRiskImpact.MODERATE}>Medium</SelectItem>
            <SelectItem value={RiskRiskImpact.HIGH}>High</SelectItem>
            <SelectItem value={RiskRiskImpact.CRITICAL}>Critical</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (likelihood) {
      return (
        <Select value={likelihood} onValueChange={(val) => onChange?.(val)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select likelihood" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RiskRiskLikelihood.UNLIKELY}>Unlikely</SelectItem>
            <SelectItem value={RiskRiskLikelihood.LIKELY}>Likely</SelectItem>
            <SelectItem value={RiskRiskLikelihood.HIGHLY_LIKELY}>Highly likely</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (status) {
      return (
        <Select value={status} onValueChange={(val) => onChange?.(val)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RiskRiskStatus.OPEN}>Open</SelectItem>
            <SelectItem value={RiskRiskStatus.MITIGATED}>Mitigated</SelectItem>
            <SelectItem value={RiskRiskStatus.ONGOING}>Ongoing</SelectItem>
            <SelectItem value={RiskRiskStatus.IN_PROGRESS}>In-progress</SelectItem>
            <SelectItem value={RiskRiskStatus.ARCHIVED}>Archived</SelectItem>
          </SelectContent>
        </Select>
      )
    }
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
        {RisksStatusMapper[status]}
      </div>
    )
  }

  return null
}

export default RiskLabel
