'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ImportFlowLayout } from '@/components/shared/record-import/import-flow-layout'
import { ImportSourceStep } from '@/components/shared/record-import/import-source-step'
import { staticImportDestination } from '@/components/shared/record-import/lib/destination-fields'
import { importDisplayNamePlural, type TImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { useImportExit } from '@/components/shared/record-import/lib/use-import-exit'
import { MAP_STEP, UPLOAD_STEP, useRecordImport } from '@/components/shared/record-import/lib/use-record-import'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount, toLowerLabel } from '@/utils/strings'
import { SUBPROCESSOR_IMPORT_FIELD_SET } from './subprocessor-import-fields'
import { SubprocessorMatchStep } from './subprocessor-match-step'
import { useSubprocessorImport } from './use-subprocessor-import'

const MATCH_STEP = { id: 'match', label: 'Match subprocessors' } as const
const STEPS = [UPLOAD_STEP, MAP_STEP, MATCH_STEP] as const
const DESTINATION = staticImportDestination(SUBPROCESSOR_IMPORT_FIELD_SET, 'subprocessors')

type TSubprocessorImportFlowProps = {
  route: TImportRoute
}

export const SubprocessorImportFlow: React.FC<TSubprocessorImportFlowProps> = ({ route }) => {
  const { successNotification, errorNotification } = useNotification()
  const [isImporting, setIsImporting] = useState(false)
  const exit = useImportExit(route)

  const entityLabel = route.displayName
  const entityLabelPlural = importDisplayNamePlural(route)
  const entityLabels = useMemo(() => [entityLabel, entityLabelPlural], [entityLabel, entityLabelPlural])

  const state = useRecordImport({ entityType: ObjectTypes.TRUST_CENTER_SUBPROCESSOR, entityLabels, steps: STEPS, destination: DESTINATION })
  const { step, parsed, plan, validation } = state
  const matching = useSubprocessorImport({ parsed, plan, enabled: step === MATCH_STEP.id })

  const rowCount = parsed?.rows.length ?? 0
  const canContinue = step === UPLOAD_STEP.id ? rowCount > 0 : validation.blockingIssues.length === 0
  const canImport = !matching.isLoading && !matching.isRefreshing && !matching.isError && matching.blockingIssues.length === 0

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const { created, linked } = await matching.runImport()
      successNotification({
        title: `${entityLabelPlural} imported`,
        description: `${pluralizeWithCount(linked, 'subprocessor')} added to your Trust Center${created > 0 ? `, including ${pluralizeWithCount(created, 'new custom subprocessor')}` : ''}.`,
      })
      exit.finish()
    } catch (error) {
      errorNotification({ title: 'Import failed', description: parseErrorMessage(error) })
    } finally {
      setIsImporting(false)
    }
  }

  const footerHint = () => {
    if (step === UPLOAD_STEP.id) return parsed ? `Header row and ${pluralizeWithCount(rowCount, 'data row')} parsed` : 'Choose a file to continue'
    if (step === MAP_STEP.id) return validation.blockingIssues.length > 0 ? 'Resolve the issues above to continue' : `${pluralizeWithCount(validation.mappedColumnCount, 'column')} mapped`
    if (matching.isLoading || matching.isRefreshing) return 'Matching your subprocessors…'
    return matching.blockingIssues.length > 0 ? 'Resolve the issues above to import' : 'Nothing in your original file is changed'
  }

  return (
    <ImportFlowLayout
      heading={`Import ${toLowerLabel(entityLabelPlural)}`}
      exit={exit}
      state={state}
      canContinue={canContinue}
      isBusy={isImporting}
      footerHint={footerHint()}
      finalAction={
        <Button variant="primary" onClick={handleImport} loading={isImporting} disabled={isImporting || exit.isFinished || !canImport}>
          {isImporting ? 'Importing…' : `Add ${pluralizeWithCount(matching.activeCount, 'subprocessor')}`}
        </Button>
      }
    >
      <ImportSourceStep entityLabel={entityLabel} entityLabelPlural={entityLabelPlural} state={state} />
      {step === MATCH_STEP.id && <SubprocessorMatchStep state={matching} />}
    </ImportFlowLayout>
  )
}
