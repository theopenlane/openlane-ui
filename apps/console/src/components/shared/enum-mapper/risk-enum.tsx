import { Archive, Circle, CircleAlert, CircleDot, CirclePlay, CircleQuestionMark, Folder, Shapes, ShieldCheck, Split, Timer, type LucideIcon } from 'lucide-react'
import { RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema.ts'

export const RiskIconMapper: Record<RiskRiskStatus, React.ReactNode> = {
  [RiskRiskStatus.ARCHIVED]: <Archive height={16} width={16} className="text-approved" />,
  [RiskRiskStatus.MITIGATED]: <Split height={16} width={16} className="text-mitigated" />,
  [RiskRiskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-in-progress" />,
  [RiskRiskStatus.OPEN]: <Circle height={16} width={16} className="text-open" />,
  [RiskRiskStatus.ONGOING]: <CirclePlay height={16} width={16} className="text-ongoing" />,
}

export const RiskStatusMapper: Record<RiskRiskStatus, string> = {
  [RiskRiskStatus.ARCHIVED]: 'Archived',
  [RiskRiskStatus.MITIGATED]: 'Mitigated',
  [RiskRiskStatus.IN_PROGRESS]: 'In progress',
  [RiskRiskStatus.OPEN]: 'Open',
  [RiskRiskStatus.ONGOING]: 'On going',
}

export enum RisksFilterIconName {
  Category = 'Category',
  Impact = 'Impact',
  Likelihood = 'Likelihood',
  RiskType = 'RiskType',
  Status = 'Status',
  ProgramName = 'ProgramName',
}

export const FilterIcons: Record<RisksFilterIconName, LucideIcon> = {
  [RisksFilterIconName.Category]: Folder,
  [RisksFilterIconName.Impact]: CircleAlert,
  [RisksFilterIconName.Likelihood]: CircleQuestionMark,
  [RisksFilterIconName.RiskType]: Shapes,
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
