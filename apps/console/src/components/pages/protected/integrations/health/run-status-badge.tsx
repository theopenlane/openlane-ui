import React from 'react'
import { Badge } from '@repo/ui/badge'
import { OPERATION_HEALTH_META, runOutcomeMeta, type TIntegrationRun, type TOperationHealthState } from '@/lib/integrations/run-health'

export const RunStatusBadge = ({ run }: { run: Pick<TIntegrationRun, 'status' | 'error'> }) => {
  const { label, variant } = runOutcomeMeta(run)

  return <Badge variant={variant}>{label}</Badge>
}

export const OperationHealthBadge = ({ state }: { state: TOperationHealthState }) => {
  const { label, variant } = OPERATION_HEALTH_META[state]

  return <Badge variant={variant}>{label}</Badge>
}
