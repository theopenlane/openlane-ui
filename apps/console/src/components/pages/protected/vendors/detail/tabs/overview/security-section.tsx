import React from 'react'
import { Check, X } from 'lucide-react'
import type { EntityQuery } from '@repo/codegen/src/schema'

const SecuritySection: React.FC<{ vendor: EntityQuery['entity'] }> = ({ vendor }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
    <div className="space-y-3">
      <SecurityCard label="Single Sign-On (SSO)">
        <StatusBadge label="Enforced" enabled={vendor.ssoEnforced ?? false} />
      </SecurityCard>
      <SecurityCard label="Multi-Factor Authentication (MFA)">
        <StatusBadge label="Supported" enabled={vendor.mfaSupported ?? false} />
        <StatusBadge label="Enforced" enabled={vendor.mfaEnforced ?? false} />
      </SecurityCard>
      <SecurityCard label="SOC 2 Compliance">
        <StatusBadge label="Compliant" enabled={vendor.hasSoc2 ?? false} />
        {vendor.soc2PeriodEnd && <span className="text-xs text-muted-foreground">Period ends: {vendor.soc2PeriodEnd}</span>}
      </SecurityCard>
    </div>
  </div>
)

const SecurityCard: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
    <span className="text-sm font-medium">{label}</span>
    <div className="flex items-center gap-3">{children}</div>
  </div>
)

const StatusBadge: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div className="flex items-center gap-1">
    {enabled ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-destructive" />}
    <span className="text-sm">{label}</span>
  </div>
)

export default SecuritySection
