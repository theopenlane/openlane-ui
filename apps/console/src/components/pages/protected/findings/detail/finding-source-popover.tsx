'use client'

import React from 'react'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { ExposureSourceDetails } from '../../exposure/detail/source/exposure-source-details'
import { ExposureSourcePopover } from '../../exposure/detail/source/exposure-source-popover'
import { getFindingSourceRows } from './finding-source'

const FindingSourceDetails: React.FC<{ finding: FindingDetailNode }> = ({ finding }) => <ExposureSourceDetails fields={finding} extraRows={getFindingSourceRows(finding)} />

export const FindingSourcePopover: React.FC<{ finding: FindingDetailNode }> = ({ finding }) => (
  <ExposureSourcePopover source={finding.source}>
    <FindingSourceDetails finding={finding} />
  </ExposureSourcePopover>
)
