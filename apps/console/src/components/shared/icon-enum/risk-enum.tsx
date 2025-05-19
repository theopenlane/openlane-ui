import { Archive, Circle, CirclePlay, Split, Timer } from 'lucide-react'
import { RiskRiskStatus } from '@repo/codegen/src/schema.ts'

export const RiskIconMapper: Record<RiskRiskStatus, React.ReactNode> = {
  [RiskRiskStatus.ARCHIVED]: <Archive height={16} width={16} />,
  [RiskRiskStatus.MITIGATED]: <Split height={16} width={16} />,
  [RiskRiskStatus.IN_PROGRESS]: <Timer height={16} width={16} />,
  [RiskRiskStatus.OPEN]: <Circle height={16} width={16} />,
  [RiskRiskStatus.ONGOING]: <CirclePlay height={16} width={16} />,
}
