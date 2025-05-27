import { Archive, Circle, RefreshCw, RouteOff, ScanEye, Stamp } from 'lucide-react'
import { ControlControlStatus } from '@repo/codegen/src/schema.ts'

export const ControlIconMapper: Record<ControlControlStatus, React.ReactNode> = {
  [ControlControlStatus.APPROVED]: <Stamp height={16} width={16} />,
  [ControlControlStatus.NEEDS_APPROVAL]: <ScanEye height={16} width={16} />,
  [ControlControlStatus.CHANGES_REQUESTED]: <RefreshCw height={16} width={16} />,
  [ControlControlStatus.ARCHIVED]: <Archive height={16} width={16} />,
  [ControlControlStatus.NOT_IMPLEMENTED]: <RouteOff height={16} width={16} />,
  [ControlControlStatus.PREPARING]: <Circle height={16} width={16} />,
}
