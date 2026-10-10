'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralize, pluralizeWithCount, toLowerLabel } from '@/utils/strings'
import { ReviewStep } from './steps/review-step'
import { IMPORT_STEPS, useRecordImport } from './lib/use-record-import'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { importDisplayNamePlural, type TImportRoute } from './lib/import-routes'
import { useImportExit } from './lib/use-import-exit'
import type { TDestinationField, TImportAutomaticValue, TImportDestination, TMappedImport } from './lib/types'
import { ImportFlowLayout } from './import-flow-layout'
import { ImportSourceStep } from './import-source-step'
import { Callout } from '@/components/shared/callout/callout'

type TRecordImportFlowProps = {
  entityType: ObjectTypes
  route: TImportRoute
  destination?: TImportDestination
  fixedFields?: readonly TDestinationField[]
  automaticValues?: readonly TImportAutomaticValue[]
  onImport: (mapped: TMappedImport) => Promise<unknown>
}

export const RecordImportFlow: React.FC<TRecordImportFlowProps> = ({ entityType, route, destination, fixedFields, automaticValues, onImport }) => {
  const { successNotification, errorNotification } = useNotification()
  const [isImporting, setIsImporting] = useState(false)

  const entityLabel = route.displayName
  const entityLabelPlural = importDisplayNamePlural(route)
  const entityLabels = useMemo(() => [entityLabel, entityLabelPlural], [entityLabel, entityLabelPlural])
  const exit = useImportExit(route)

  const state = useRecordImport({ entityType, entityLabels, steps: IMPORT_STEPS, destination, fixedFields })
  const { step, goToStep, parsed, columns, mapping, validation, plan, toMappedImport, rowOrder, moveRow, isLoadingFields, isDestinationError } = state

  const rowCount = parsed?.rows.length ?? 0
  const recordCount = (count: number) => `${count.toLocaleString()} ${toLowerLabel(pluralize(count, entityLabel, entityLabelPlural))}`
  const hasBlockingIssues = validation.blockingIssues.length > 0
  const canContinue = step === 'upload' ? Boolean(parsed) && rowCount > 0 && !isLoadingFields : !hasBlockingIssues

  const handleImport = async () => {
    setIsImporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      const mapped = toMappedImport()
      if (!mapped) return

      await onImport(mapped)
      successNotification({
        title: `${entityLabelPlural} imported`,
        description: `${recordCount(rowCount)} imported from ${parsed?.fileName}.`,
      })
      exit.finish()
    } catch (error) {
      errorNotification({ title: 'Import failed', description: parseErrorMessage(error) })
    } finally {
      setIsImporting(false)
    }
  }

  const footerHint = () => {
    if (step === 'upload') {
      if (!parsed) return 'Choose a file to continue'
      if (isLoadingFields) return `Loading the ${toLowerLabel(entityLabel)} field reference…`
      if (rowCount === 0) return 'Choose a file with at least one data row'

      return `Header row and ${pluralizeWithCount(rowCount, 'data row')} parsed`
    }

    if (step === 'map') {
      if (hasBlockingIssues) return 'Resolve the issues above to continue'

      return `${pluralizeWithCount(validation.mappedColumnCount, 'column')} mapped · ${validation.ignoredColumnCount} ignored`
    }

    return 'Nothing in your original file is changed'
  }

  return (
    <ImportFlowLayout
      route={route}
      exit={exit}
      state={state}
      canContinue={canContinue}
      isBusy={isImporting}
      footerHint={footerHint()}
      finalAction={
        <Button variant="primary" onClick={handleImport} loading={isImporting} disabled={isImporting || exit.isFinished || !parsed || hasBlockingIssues}>
          {isImporting ? 'Importing…' : `Import ${recordCount(rowCount)}`}
        </Button>
      }
    >
      {isDestinationError ? (
        <p className="py-10 text-center text-sm text-muted-foreground">The {toLowerLabel(entityLabel)} field reference could not be loaded, so columns cannot be mapped. Please try again later.</p>
      ) : (
        <>
          <ImportSourceStep entityLabel={entityLabel} entityLabelPlural={entityLabelPlural} state={state} />
          {step === 'review' && parsed && route.importNotice && (
            <Callout variant="warning" compact>
              {route.importNotice}
            </Callout>
          )}
          {step === 'review' && parsed && (
            <ReviewStep
              entityLabel={entityLabel}
              entityLabelPlural={entityLabelPlural}
              parsed={parsed}
              rowOrder={rowOrder}
              columns={columns}
              mapping={mapping}
              plan={plan}
              automaticValues={automaticValues}
              reorderable={Boolean(route.reorderable)}
              onMoveRow={moveRow}
              onEditMapping={() => goToStep('map')}
            />
          )}
        </>
      )}
    </ImportFlowLayout>
  )
}
