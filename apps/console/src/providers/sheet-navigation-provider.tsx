'use client'

import React, { createContext, use, useState } from 'react'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ViewPolicySheet } from '@/components/pages/protected/policies/view-policy-sheet'
import { ViewProcedureSheet } from '@/components/pages/protected/procedures/view-procedure-sheet'
import ViewVulnerabilitySheet from '@/components/pages/protected/vulnerabilities/view-vulnerability-sheet'
import ViewRiskSheet from '@/components/pages/protected/risks/view-risk-sheet'
import ViewScanSheet from '@/components/pages/protected/scans/view-scan-sheet'
import ViewFindingSheet from '@/components/pages/protected/findings/view-finding-sheet'
import ViewRemediationSheet from '@/components/pages/protected/remediations/view-remediation-sheet'
import ViewAssetSheet from '@/components/pages/protected/assets/view-asset-sheet'

export const SHEET_KINDS = new Set<string>([
  ObjectAssociationNodeEnum.POLICY,
  ObjectAssociationNodeEnum.PROCEDURE,
  ObjectAssociationNodeEnum.VULNERABILITY,
  ObjectAssociationNodeEnum.RISKS,
  ObjectAssociationNodeEnum.SCAN,
  ObjectAssociationNodeEnum.FINDING,
  ObjectAssociationNodeEnum.REMEDIATION,
  ObjectAssociationNodeEnum.ASSET,
])

type SheetNavigationContextValue = {
  openSheet: (id: string, kind: string) => void
}

const SheetNavigationContext = createContext<SheetNavigationContextValue | null>(null)

export const useSheetNavigation = () => use(SheetNavigationContext)

type ActiveSheet = { id: string; kind: string } | null

export const SheetNavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const closeSheet = () => setActiveSheet(null)

  const openSheet = (id: string, kind: string) => {
    if (SHEET_KINDS.has(kind)) {
      setActiveSheet({ id, kind })
    }
  }

  return (
    <SheetNavigationContext value={{ openSheet }}>
      {children}
      <ViewPolicySheet policyId={activeSheet?.kind === ObjectAssociationNodeEnum.POLICY ? activeSheet.id : null} onClose={closeSheet} />
      <ViewProcedureSheet procedureId={activeSheet?.kind === ObjectAssociationNodeEnum.PROCEDURE ? activeSheet.id : null} onClose={closeSheet} />
      <ViewVulnerabilitySheet entityId={activeSheet?.kind === ObjectAssociationNodeEnum.VULNERABILITY ? activeSheet.id : null} onClose={closeSheet} />
      <ViewRiskSheet entityId={activeSheet?.kind === ObjectAssociationNodeEnum.RISKS ? activeSheet.id : null} onClose={closeSheet} />
      <ViewScanSheet entityId={activeSheet?.kind === ObjectAssociationNodeEnum.SCAN ? activeSheet.id : null} onClose={closeSheet} />
      <ViewFindingSheet entityId={activeSheet?.kind === ObjectAssociationNodeEnum.FINDING ? activeSheet.id : null} onClose={closeSheet} />
      <ViewRemediationSheet entityId={activeSheet?.kind === ObjectAssociationNodeEnum.REMEDIATION ? activeSheet.id : null} onClose={closeSheet} />
      <ViewAssetSheet entityId={activeSheet?.kind === ObjectAssociationNodeEnum.ASSET ? activeSheet.id : null} onClose={closeSheet} />
    </SheetNavigationContext>
  )
}
