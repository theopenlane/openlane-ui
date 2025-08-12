import { Archive, Circle, CirclePlay, Split, Timer } from 'lucide-react'
import { RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema.ts'

export const RiskIconMapper: Record<RiskRiskStatus, React.ReactNode> = {
  [RiskRiskStatus.ARCHIVED]: <Archive height={16} width={16} />,
  [RiskRiskStatus.MITIGATED]: <Split height={16} width={16} />,
  [RiskRiskStatus.IN_PROGRESS]: <Timer height={16} width={16} />,
  [RiskRiskStatus.OPEN]: <Circle height={16} width={16} />,
  [RiskRiskStatus.ONGOING]: <CirclePlay height={16} width={16} />,
}

export const RiskLikelihoodOptions = Object.values(RiskRiskLikelihood).map((value) => ({
  label: value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value,
}))

export const RiskStatusOptions = Object.values(RiskRiskStatus).map((value) => ({
  label: value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value,
}))
