'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { Check, X } from 'lucide-react'
import type { EntityQuery } from '@repo/codegen/src/schema'

interface OverviewTabProps {
  vendor: EntityQuery['entity']
  isEditing: boolean
  canEdit: boolean
}

const OverviewTab: React.FC<OverviewTabProps> = ({ vendor }) => {
  return (
    <div className="space-y-6">
      {vendor.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: vendor.description }} />
          </CardContent>
        </Card>
      )}

      {vendor.domains && vendor.domains.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {vendor.domains.map((domain) => (
                <Badge key={domain} variant="outline">
                  {domain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SecurityBadge label="SSO Enforced" enabled={vendor.ssoEnforced ?? false} />
            <SecurityBadge label="MFA Supported" enabled={vendor.mfaSupported ?? false} />
            <SecurityBadge label="MFA Enforced" enabled={vendor.mfaEnforced ?? false} />
          </div>
          {vendor.hasSoc2 !== null && vendor.hasSoc2 !== undefined && (
            <div className="mt-4">
              <SecurityBadge label="SOC 2 Compliance" enabled={vendor.hasSoc2} />
              {vendor.soc2PeriodEnd && <p className="text-xs text-muted-foreground mt-1 ml-7">Period ends: {vendor.soc2PeriodEnd}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {vendor.statusPageURL && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Status Page</CardTitle>
          </CardHeader>
          <CardContent>
            <a href={vendor.statusPageURL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
              {vendor.statusPageURL}
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const SecurityBadge: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div className="flex items-center gap-2">
    {enabled ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-muted-foreground" />}
    <span className={`text-sm ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
  </div>
)

export default OverviewTab
