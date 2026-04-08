'use client'

import React from 'react'
import { z } from 'zod'
import { responsibilityFieldSchema } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { PlatformPlatformStatus } from '@repo/codegen/src/schema'
import type { StepConfig } from '@/components/shared/crud-base/types'
import StepBasicInfo from './step-basic-info'
import StepBusinessPurpose from './step-business-purpose'
import StepDataFlow from './step-data-flow'
import StepTrustBoundary from './step-trust-boundary'
import StepAuditScope from './step-audit-scope'
import StepOwnership from './step-ownership'
import StepLinkAssetsVendors from './step-link-assets-vendors'

export const createPlatformSteps = (): StepConfig[] => [
  {
    id: 'basic-info',
    label: 'Basic Info',
    schema: z.object({
      name: z.string().min(1, 'Name is required'),
      status: z.nativeEnum(PlatformPlatformStatus).optional(),
      description: z.string().optional(),
    }),
    render: () => <StepBasicInfo />,
  },
  {
    id: 'business-purpose',
    label: 'Business Purpose',
    schema: z.object({
      businessPurpose: z.string().optional(),
    }),
    render: () => <StepBusinessPurpose />,
  },
  {
    id: 'data-flow',
    label: 'Data Flow',
    schema: z.object({
      dataFlowSummary: z.string().optional(),
    }),
    render: () => <StepDataFlow />,
  },
  {
    id: 'trust-boundary',
    label: 'Trust Boundary',
    schema: z.object({
      trustBoundaryDescription: z.string().optional(),
    }),
    render: () => <StepTrustBoundary />,
  },
  {
    id: 'audit-scope',
    label: 'Audit Scope',
    schema: z.object({
      scopeName: z.string().optional().nullable(),
      environmentName: z.string().optional().nullable(),
      containsPii: z.boolean().optional(),
    }),
    render: () => <StepAuditScope />,
  },
  {
    id: 'ownership',
    label: 'Ownership',
    schema: z.object({
      platformOwner: responsibilityFieldSchema,
      businessOwner: responsibilityFieldSchema,
      technicalOwner: responsibilityFieldSchema,
    }),
    render: () => <StepOwnership />,
  },
  {
    id: 'link-assets-vendors',
    label: 'Assets & Vendors',
    schema: z.object({
      assetIDs: z.array(z.string()).optional(),
      outOfScopeAssetIDs: z.array(z.string()).optional(),
      entityIDs: z.array(z.string()).optional(),
      outOfScopeVendorIDs: z.array(z.string()).optional(),
    }),
    render: () => <StepLinkAssetsVendors />,
  },
]
