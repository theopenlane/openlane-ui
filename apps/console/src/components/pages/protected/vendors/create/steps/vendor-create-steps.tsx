'use client'

import React from 'react'
import { z } from 'zod'
import { responsibilityFieldSchema } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import type { StepConfig } from '@/components/shared/crud-base/types'
import StepVendorInfo from './step-vendor-info'
import StepOwnership from './step-ownership'
import StepUploadImport from './step-upload-import'

export const createVendorSteps = (onStagedFilesChange: (files: File[]) => void, onExistingFileIdsChange: (fileIds: string[]) => void): StepConfig[] => [
  {
    id: 'vendor-info',
    label: 'Vendor Info',
    schema: z.object({
      name: z.string().min(1, 'Name is required'),
      displayName: z.string().optional(),
      description: z.custom().optional(),
      status: z.string().optional(),
      environmentName: z.string().optional(),
      scopeName: z.string().optional().nullable(),
    }),
    render: () => <StepVendorInfo />,
  },
  {
    id: 'ownership',
    label: 'Ownership',
    schema: z.object({
      internalOwner: responsibilityFieldSchema,
      reviewedBy: responsibilityFieldSchema,
    }),
    render: () => <StepOwnership />,
  },
  {
    id: 'upload-import',
    label: 'Documents',
    schema: z.object({}),
    render: () => <StepUploadImport onStagedFilesChange={onStagedFilesChange} onExistingFileIdsChange={onExistingFileIdsChange} />,
  },
]
