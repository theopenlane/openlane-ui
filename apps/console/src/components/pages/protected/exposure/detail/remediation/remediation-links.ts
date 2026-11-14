import { type ReactNode } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'

export type TExposureLinkedTo = { vulnerabilityIDs: string[] } | { findingIDs: string[] }

export type TLinkActionPlanDialogProps = {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const LINK_ACTION_PLAN_DIALOG_PROPS = {
  defaultSelectedObject: ObjectTypeObjects.ACTION_PLAN,
  allowedObjectTypes: [ObjectTypeObjects.ACTION_PLAN],
}
