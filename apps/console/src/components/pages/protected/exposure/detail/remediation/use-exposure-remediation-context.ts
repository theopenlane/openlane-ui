import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { type TRemediationContextRef } from '@/components/pages/protected/remediations/sheet/remediation-context'
import { buildExposureTaskDefaults } from './task-defaults'

export type TExposureLinkedTo = { vulnerabilityIDs: string[] } | { findingIDs: string[] }

const EXPOSURE_KINDS = {
  finding: {
    label: 'Finding',
    nodeType: ObjectAssociationNodeEnum.FINDING,
    objectType: ObjectTypeObjects.FINDING,
    linkedTo: (id: string): TExposureLinkedTo => ({ findingIDs: [id] }),
  },
  vulnerability: {
    label: 'Vulnerability',
    nodeType: ObjectAssociationNodeEnum.VULNERABILITY,
    objectType: ObjectTypeObjects.VULNERABILITY,
    linkedTo: (id: string): TExposureLinkedTo => ({ vulnerabilityIDs: [id] }),
  },
} as const

export type TExposureKind = keyof typeof EXPOSURE_KINDS

export type TExposureRemediationContext = {
  taskInitialValues: ReturnType<typeof buildExposureTaskDefaults>
  linkedTo: TExposureLinkedTo
  remediationContext: TRemediationContextRef
  defaultSelectedObject: ObjectTypeObjects
  initialInstructions?: string
}

export const useExposureRemediationContext = (kind: TExposureKind, id: string, title: string, initialInstructions?: string | null): TExposureRemediationContext => {
  const { data: session } = useSession()
  const assigneeID = session?.user?.userId

  return useMemo(() => {
    const config = EXPOSURE_KINDS[kind]
    return {
      taskInitialValues: buildExposureTaskDefaults(config.label, title, assigneeID),
      linkedTo: config.linkedTo(id),
      remediationContext: { type: config.nodeType, id },
      defaultSelectedObject: config.objectType,
      initialInstructions: initialInstructions?.trim() || undefined,
    }
  }, [kind, id, title, assigneeID, initialInstructions])
}
