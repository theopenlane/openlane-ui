import {
  Archive,
  Circle,
  CircleAlert,
  CircleDot,
  CirclePlay,
  CircleQuestionMark,
  Folder,
  Gauge,
  ShieldCheck,
  Split,
  Timer,
  type LucideIcon,
  Flag,
  CircleCheck,
  CircleX,
  SquareArrowRight,
} from 'lucide-react'
import { RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema.ts'

export const RiskIconMapper: Record<RiskRiskStatus, React.ReactNode> = {
  [RiskRiskStatus.ARCHIVED]: <Archive height={16} width={16} className="text-archived" />,
  [RiskRiskStatus.MITIGATED]: <Split height={16} width={16} className="text-mitigated" />,
  [RiskRiskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-in-progress" />,
  [RiskRiskStatus.OPEN]: <Circle height={16} width={16} className="text-open" />,
  [RiskRiskStatus.ONGOING]: <CirclePlay height={16} width={16} className="text-ongoing" />,
  [RiskRiskStatus.IDENTIFIED]: <Flag height={16} width={16} className="text-open" />,
  [RiskRiskStatus.ACCEPTED]: <CircleCheck height={16} width={16} className="text-ongoing" />,
  [RiskRiskStatus.TRANSFERRED]: <SquareArrowRight height={16} width={16} className="text-ongoing" />,
  [RiskRiskStatus.CLOSED]: <CircleX height={16} width={16} className="text-rejected" />,
}

export enum RisksFilterIconName {
  Category = 'Category',
  Impact = 'Impact',
  Likelihood = 'Likelihood',
  RiskType = 'RiskType',
  Score = 'Score',
  Status = 'Status',
  ProgramName = 'ProgramName',
}

export const FilterIcons: Record<RisksFilterIconName, LucideIcon> = {
  [RisksFilterIconName.Category]: Folder,
  [RisksFilterIconName.Impact]: CircleAlert,
  [RisksFilterIconName.Likelihood]: CircleQuestionMark,
  [RisksFilterIconName.RiskType]: Gauge,
  [RisksFilterIconName.Score]: Gauge,
  [RisksFilterIconName.Status]: CircleDot,
  [RisksFilterIconName.ProgramName]: ShieldCheck,
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
