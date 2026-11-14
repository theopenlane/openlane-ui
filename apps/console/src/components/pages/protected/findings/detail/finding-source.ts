import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { type TSourceDetailRow } from '../../exposure/detail/source/use-exposure-source'

export const getFindingSourceRows = (finding: FindingDetailNode): TSourceDetailRow[] => [
  { label: 'Resource', value: finding.resourceName, copyable: true },
  { label: 'Source state', value: finding.state },
  { label: 'Assessment ID', value: finding.assessmentID, copyable: true },
]
