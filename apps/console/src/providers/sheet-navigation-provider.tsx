'use client'

import React, { createContext, use, useCallback, useMemo, useState } from 'react'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ViewPolicySheet } from '@/components/pages/protected/policies/view-policy-sheet'
import { ViewProcedureSheet } from '@/components/pages/protected/procedures/view-procedure-sheet'
import ViewVulnerabilitySheet from '@/components/pages/protected/vulnerabilities/view-vulnerability-sheet'
import ViewRiskSheet from '@/components/pages/protected/risks/view-risk-sheet'
import ViewScanSheet from '@/components/pages/protected/scans/view-scan-sheet'
import ViewFindingSheet from '@/components/pages/protected/findings/view-finding-sheet'
import ViewRemediationSheet from '@/components/pages/protected/remediations/view-remediation-sheet'
import ViewAssetSheet from '@/components/pages/protected/assets/view-asset-sheet'
import ControlObjectiveDetailsSheet from '@/components/pages/protected/controls/tabs/implementation/control-objectives-components/control-objective-details-sheet'
import ControlImplementationDetailsSheet from '@/components/pages/protected/controls/tabs/implementation/control-implementation-components/control-implementation-details-sheet'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import ViewVendorSheet from '@/components/pages/protected/vendors/view-vendor-sheet'
import ViewPersonnelSheet from '@/components/pages/protected/personnel/view-personnel-sheet'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import ReviewSheetResolver from '@/components/pages/protected/reviews/common/review-sheet-resolver'
import { useRouter } from 'next/navigation'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

export const FULL_PAGE_KINDS = new Set<string>([ObjectAssociationNodeEnum.CONTROL, ObjectAssociationNodeEnum.SUBCONTROL])

const SHEET_KIND_LIST = [
  ObjectAssociationNodeEnum.POLICY,
  ObjectAssociationNodeEnum.PROCEDURE,
  ObjectAssociationNodeEnum.VULNERABILITY,
  ObjectAssociationNodeEnum.RISKS,
  ObjectAssociationNodeEnum.SCAN,
  ObjectAssociationNodeEnum.FINDING,
  ObjectAssociationNodeEnum.REMEDIATION,
  ObjectAssociationNodeEnum.ASSET,
  ObjectAssociationNodeEnum.CONTROL_OBJECTIVE,
  ObjectAssociationNodeEnum.CONTROL_IMPLEMENTATION,
  ObjectAssociationNodeEnum.TASK,
  ObjectAssociationNodeEnum.EVIDENCE,
  ObjectAssociationNodeEnum.ENTITY,
  ObjectAssociationNodeEnum.IDENTITY_HOLDER,
  ObjectAssociationNodeEnum.REVIEW,
] as const

export type SheetKind = (typeof SHEET_KIND_LIST)[number]

const SHEET_KINDS: ReadonlySet<string> = new Set<string>(SHEET_KIND_LIST)

export const isSheetKind = (kind: string): kind is SheetKind => SHEET_KINDS.has(kind)

type SheetNavigationContextValue = {
  openSheet: (id: string, kind: SheetKind) => void
}

const SheetNavigationContext = createContext<SheetNavigationContextValue | null>(null)

export const useSheetNavigation = () => use(SheetNavigationContext)

export const useOpenObjectSheet = () => {
  const sheetNavigation = useSheetNavigation()
  const router = useRouter()

  return useCallback(
    (id: string, kind: ObjectAssociationNodeEnum) => {
      if (sheetNavigation && isSheetKind(kind)) {
        sheetNavigation.openSheet(id, kind)
        return
      }

      const href = getHrefForObjectType(kind, { id })
      if (href) {
        router.push(href)
      }
    },
    [sheetNavigation, router],
  )
}

type ActiveSheet = { id: string; kind: SheetKind } | null

const renderSheetContent = (id: string, kind: SheetKind, onClose: () => void) => {
  switch (kind) {
    case ObjectAssociationNodeEnum.POLICY:
      return <ViewPolicySheet policyId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.PROCEDURE:
      return <ViewProcedureSheet procedureId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.VULNERABILITY:
      return <ViewVulnerabilitySheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.RISKS:
      return <ViewRiskSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.SCAN:
      return <ViewScanSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.FINDING:
      return <ViewFindingSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.REMEDIATION:
      return <ViewRemediationSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.ASSET:
      return <ViewAssetSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.CONTROL_OBJECTIVE:
      return <ControlObjectiveDetailsSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.CONTROL_IMPLEMENTATION:
      return <ControlImplementationDetailsSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.TASK:
      return <TaskDetailsSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.EVIDENCE:
      return <EvidenceDetailsSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.ENTITY:
      return <ViewVendorSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.IDENTITY_HOLDER:
      return <ViewPersonnelSheet identityHolderId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.REVIEW:
      return <ReviewSheetResolver reviewId={id} onClose={onClose} />
    default:
      kind satisfies never
      return null
  }
}

const renderSheet = (activeSheet: ActiveSheet, onClose: () => void) => {
  if (!activeSheet) return null

  return <React.Fragment key={`${activeSheet.kind}:${activeSheet.id}`}>{renderSheetContent(activeSheet.id, activeSheet.kind, onClose)}</React.Fragment>
}

export const SheetNavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const closeSheet = useCallback(() => setActiveSheet(null), [])

  const openSheet = useCallback((id: string, kind: SheetKind) => setActiveSheet({ id, kind }), [])

  const contextValue = useMemo(() => ({ openSheet }), [openSheet])

  return (
    <SheetNavigationContext value={contextValue}>
      {children}
      {renderSheet(activeSheet, closeSheet)}
    </SheetNavigationContext>
  )
}
