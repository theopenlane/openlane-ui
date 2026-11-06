'use client'

import React from 'react'
import { type FindingDetailNode, useFindingSourceIntegrations } from '@/lib/graphql-hooks/finding'
import { ExposureSourceDetails } from '../../exposure/detail/source/exposure-source-details'
import { ExposureSourcePopover } from '../../exposure/detail/source/exposure-source-popover'

const FindingSourceDetails: React.FC<{ finding: FindingDetailNode }> = ({ finding }) => {
  const { integrations } = useFindingSourceIntegrations(finding.id)

  return (
    <ExposureSourceDetails
      fields={finding}
      integrations={integrations}
      extraRows={[
        { label: 'Resource', value: finding.resourceName, copyable: true },
        { label: 'Source state', value: finding.state },
        { label: 'Assessment ID', value: finding.assessmentID, copyable: true },
      ]}
    />
  )
}

export const FindingSourcePopover: React.FC<{ finding: FindingDetailNode }> = ({ finding }) => (
  <ExposureSourcePopover source={finding.source}>
    <FindingSourceDetails finding={finding} />
  </ExposureSourcePopover>
)
