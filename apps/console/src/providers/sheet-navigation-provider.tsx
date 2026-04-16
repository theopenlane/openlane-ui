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

export const FULL_PAGE_KINDS = new Set<string>([ObjectAssociationNodeEnum.CONTROL, ObjectAssociationNodeEnum.SUBCONTROL])

export const SHEET_KINDS = new Set<string>([
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
  ObjectAssociationNodeEnum.ENTITY,
  ObjectAssociationNodeEnum.IDENTITY_HOLDER,
])

type SheetNavigationContextValue = {
  openSheet: (id: string, kind: string) => void
}

const SheetNavigationContext = createContext<SheetNavigationContextValue | null>(null)

export const useSheetNavigation = () => use(SheetNavigationContext)

type ActiveSheet = { id: string; kind: string } | null

const renderSheet = (activeSheet: ActiveSheet, onClose: () => void) => {
  if (!activeSheet) return null
  const { id, kind } = activeSheet

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
    case ObjectAssociationNodeEnum.ENTITY:
      return <ViewVendorSheet entityId={id} onClose={onClose} />
    case ObjectAssociationNodeEnum.IDENTITY_HOLDER:
      return <ViewPersonnelSheet identityHolderId={id} onClose={onClose} />
    default:
      return null
  }
}

export const SheetNavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const closeSheet = useCallback(() => setActiveSheet(null), [])

  const openSheet = useCallback((id: string, kind: string) => {
    if (SHEET_KINDS.has(kind)) {
      setActiveSheet({ id, kind })
    }
  }, [])

  const contextValue = useMemo(() => ({ openSheet }), [openSheet])

  return (
    <SheetNavigationContext value={contextValue}>
      {children}
      {renderSheet(activeSheet, closeSheet)}
    </SheetNavigationContext>
  )
}
