import { Archive, Circle, FilePenLine, RefreshCw, RouteOff, ScanEye, Stamp, ThumbsUp } from 'lucide-react'
import { ControlControlStatus, ControlImplementationDocumentStatus } from '@repo/codegen/src/schema.ts'

export const ControlIconMapper: Record<ControlControlStatus, React.ReactNode> = {
  [ControlControlStatus.APPROVED]: <Stamp height={16} width={16} />,
  [ControlControlStatus.NEEDS_APPROVAL]: <ScanEye height={16} width={16} />,
  [ControlControlStatus.CHANGES_REQUESTED]: <RefreshCw height={16} width={16} />,
  [ControlControlStatus.ARCHIVED]: <Archive height={16} width={16} />,
  [ControlControlStatus.NOT_IMPLEMENTED]: <RouteOff height={16} width={16} />,
  [ControlControlStatus.PREPARING]: <Circle height={16} width={16} />,
}

export const ControlImplementationIconMap: Record<ControlImplementationDocumentStatus, React.ReactNode> = {
  [ControlImplementationDocumentStatus.DRAFT]: <FilePenLine size={16} />,
  [ControlImplementationDocumentStatus.APPROVED]: <ThumbsUp size={16} />,
  [ControlImplementationDocumentStatus.ARCHIVED]: <Archive size={16} />,
  [ControlImplementationDocumentStatus.NEEDS_APPROVAL]: <ScanEye size={16} />, // Use distinct icon
  [ControlImplementationDocumentStatus.PUBLISHED]: <Archive size={16} />,
}
