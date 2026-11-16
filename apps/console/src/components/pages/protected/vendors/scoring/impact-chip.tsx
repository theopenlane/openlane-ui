import React from 'react'
import { type VendorRiskScoreVendorRiskImpact } from '@repo/codegen/src/schema'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { vendorRiskImpactLevel } from '@/lib/vendor-risk-rating'

export const ImpactChip: React.FC<{ impact: VendorRiskScoreVendorRiskImpact }> = ({ impact }) => <SeverityChip severity={impact} level={vendorRiskImpactLevel(impact)} suffix="impact" />
