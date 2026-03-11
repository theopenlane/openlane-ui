'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { AlertTriangle } from 'lucide-react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDate } from '@/utils/date'
import type { EntityQuery } from '@repo/codegen/src/schema'

interface RiskReviewTabProps {
  vendor: EntityQuery['entity']
}

const RiskReviewTab: React.FC<RiskReviewTabProps> = ({ vendor }) => {
  const isOverdue = vendor.nextReviewAt && new Date(vendor.nextReviewAt) < new Date()

  return (
    <div className="space-y-6">
      {isOverdue && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">Review is overdue. Next review was due {formatDate(vendor.nextReviewAt)}.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskCard label="Tier" value={vendor.tier ?? '—'} />
        <RiskCard label="Risk Rating" value={vendor.riskRating ?? '—'} />
        <RiskCard label="Risk Score" value={vendor.riskScore !== null && vendor.riskScore !== undefined ? String(vendor.riskScore) : '—'} />
        <RiskCard label="Renewal Risk" value={vendor.renewalRisk ?? '—'} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Review Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Review Frequency</p>
              <p className="text-sm font-medium">{vendor.reviewFrequency ? getEnumLabel(vendor.reviewFrequency) : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Reviewed</p>
              <p className="text-sm font-medium">{formatDate(vendor.lastReviewedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Review</p>
              <p className="text-sm font-medium">{formatDate(vendor.nextReviewAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const RiskCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card>
    <CardContent className="p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </CardContent>
  </Card>
)

export default RiskReviewTab
