'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { formatDate } from '@/utils/date'
import type { EntityQuery } from '@repo/codegen/src/schema'

interface ContractTabProps {
  vendor: EntityQuery['entity']
}

const ContractTab: React.FC<ContractTabProps> = ({ vendor }) => {
  const hasContractData =
    vendor.contractStartDate || vendor.contractEndDate || vendor.contractRenewalAt || vendor.annualSpend || vendor.billingModel || vendor.terminationNoticeDays || vendor.autoRenews !== null

  if (!hasContractData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No contract details available for this vendor.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-md">Contract Details</CardTitle>
            {vendor.autoRenews && <Badge variant="outline">Auto-Renews</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ContractField label="Contract Start" value={formatDate(vendor.contractStartDate)} />
            <ContractField label="Contract End" value={formatDate(vendor.contractEndDate)} />
            <ContractField label="Renewal Date" value={formatDate(vendor.contractRenewalAt)} />
            <ContractField label="Termination Notice" value={vendor.terminationNoticeDays ? `${vendor.terminationNoticeDays} days` : '—'} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ContractField label="Annual Spend" value={vendor.annualSpend ? `${vendor.spendCurrency ?? 'USD'} ${vendor.annualSpend.toLocaleString()}` : '—'} />
            <ContractField label="Billing Model" value={vendor.billingModel ?? '—'} />
            <ContractField label="Currency" value={vendor.spendCurrency ?? '—'} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const ContractField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
)

export default ContractTab
