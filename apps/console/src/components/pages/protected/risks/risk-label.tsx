import { SquareArrowDown, SquareArrowRight, SquareArrowUpRight, SquareArrowUp, RotateCcw, ShieldCheck, RefreshCcw, Play, Archive, RefreshCw, Umbrella, CirclePlay } from 'lucide-react'

import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'

interface RiskLabelProps {
  score?: number
  impact?: RiskRiskImpact
  likelihood?: RiskRiskLikelihood
  status?: RiskRiskStatus
}

export const RiskLabel = ({ score, impact, likelihood, status }: RiskLabelProps) => {
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
    switch (status) {
      case RiskRiskStatus.OPEN:
        return (
          <div className=" flex gap-2 items-center text-sm">
            <RotateCcw size={16} />
            Open
          </div>
        )
      case RiskRiskStatus.MITIGATED:
        return (
          <div className=" flex gap-2 items-center text-sm">
            <Umbrella size={16} />
            Mitigated
          </div>
        )
      case RiskRiskStatus.ONGOING:
        return (
          <div className=" flex gap-2 items-center text-sm">
            <RefreshCw size={16} />
            Ongoing
          </div>
        )
      case RiskRiskStatus.IN_PROGRESS:
        return (
          <div className=" flex gap-2 items-center text-sm">
            <CirclePlay size={16} />
            In-progress
          </div>
        )
      case RiskRiskStatus.ARCHIVED:
        return (
          <div className=" flex gap-2 items-center text-sm">
            <Archive size={16} />
            Archived
          </div>
        )
    }
  }

  return null
}
