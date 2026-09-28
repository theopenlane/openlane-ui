'use client'

import React, { useId, useState } from 'react'
import { FieldReferencePanel } from './field-reference-panel'
import { UploadStep } from './steps/upload-step'
import { MappingStep } from './steps/mapping-step'
import { MAP_STEP, UPLOAD_STEP, type TImportSourceState } from './lib/use-record-import'

type TImportSourceStepProps = {
  entityLabel: string
  entityLabelPlural: string
  state: TImportSourceState
}

export const ImportSourceStep: React.FC<TImportSourceStepProps> = ({ entityLabel, entityLabelPlural, state }) => {
  const [isFieldReferenceOpen, setIsFieldReferenceOpen] = useState(false)
  const fieldReferenceId = useId()

  if (state.step === UPLOAD_STEP.id) {
    return (
      <>
        <UploadStep
          entityLabel={entityLabel}
          parsed={state.parsed}
          onFileParsed={state.applyFile}
          requiredGroups={state.requiredGroups}
          isLoadingFields={state.isLoadingFields}
          fieldReferenceId={fieldReferenceId}
          isFieldReferenceOpen={isFieldReferenceOpen}
          onToggleFieldReference={() => setIsFieldReferenceOpen((open) => !open)}
        />
        {isFieldReferenceOpen && (
          <FieldReferencePanel
            id={fieldReferenceId}
            entityLabel={entityLabel}
            fields={state.fields}
            isLoading={state.isLoadingFields}
            exampleCsv={state.exampleCsv}
            exampleFilename={state.exampleFilename}
          />
        )}
      </>
    )
  }

  if (state.step === MAP_STEP.id && state.parsed) {
    return (
      <MappingStep
        entityLabel={entityLabel}
        entityLabelPlural={entityLabelPlural}
        columns={state.columns}
        fields={state.fields}
        hasRequirements={state.requiredGroups.length > 0}
        mapping={state.mapping}
        validation={state.validation}
        cellChecks={state.cellChecks}
        rowCount={state.parsed.rows.length}
        onColumnFieldChange={state.setColumnField}
        onColumnValueChange={state.setColumnValue}
        onColumnDateOrderChange={state.setColumnDateOrder}
      />
    )
  }

  return null
}
