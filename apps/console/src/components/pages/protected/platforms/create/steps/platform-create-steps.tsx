'use client'

import React from 'react'
import { z } from 'zod'
import { responsibilityFieldSchema } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { PlatformPlatformStatus } from '@repo/codegen/src/schema'
import type { StepConfig } from '@/components/shared/crud-base/types'
import StepBasicInfo from './step-basic-info'
import StepDataFlow from './step-data-flow'
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
      businessPurpose: z.string().optional(),
    }),
    render: () => <StepBasicInfo />,
  },
  {
    id: 'data-flow',
    label: 'Data Flow',
    schema: z.object({
      dataFlowSummary: z.string().optional(),
      trustBoundaryDescription: z.string().optional(),
    }),
    render: () => <StepDataFlow />,
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
      platformOwnerID: z.string().optional().nullable(),
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
