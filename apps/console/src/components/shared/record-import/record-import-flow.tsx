'use client'

import React, { useEffect, useId, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNavigationGuard } from 'nextjs-nav-guard'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralize, pluralizeTypeName, pluralizeWithCount, toHumanLabel } from '@/utils/strings'
import { ImportStepNav } from './import-step-nav'
import { FieldReferencePanel } from './field-reference-panel'
import { UploadStep } from './steps/upload-step'
import { MappingStep } from './steps/mapping-step'
import { ReviewStep } from './steps/review-step'
import { useRecordImport } from './lib/use-record-import'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'
import { RETURN_TO_PARAM, type TImportRoute } from './lib/import-routes'
type TRecordImportFlowProps = {
  entityType: ObjectTypes
  route: TImportRoute
  onImport: (file: File) => Promise<unknown>
}

export const RecordImportFlow: React.FC<TRecordImportFlowProps> = ({ entityType, route, onImport }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { successNotification, errorNotification } = useNotification()
  const [isImporting, setIsImporting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isFieldReferenceOpen, setIsFieldReferenceOpen] = useState(false)

  const entityLabel = route.displayName
  const entityLabelPlural = route.displayNamePlural ?? toHumanLabel(pluralizeTypeName(entityLabel))
  const entityLabels = useMemo(() => [entityLabel, entityLabelPlural], [entityLabel, entityLabelPlural])
  const returnHref = sanitizeLoginRedirect(searchParams.get(RETURN_TO_PARAM), route.listHref)
  const backLabel = returnHref.split('?')[0] === route.listHref.split('?')[0] ? `Back to ${route.listLabel}` : 'Back'
  const fieldReferenceId = useId()

  const {
    step,
    isFirstStep,
    isLastStep,
    goToStep,
    goNext,
    goBack,
    parsed,
    applyFile,
    columns,
    fields,
    requiredGroups,
    mapping,
    setColumnField,
    validation,
    plan,
    toImportFile,
    exampleCsv,
    exampleFilename,
    isLoadingFields,
    isExampleError,
  } = useRecordImport({ entityType, entityLabels })

  const navGuard = useNavigationGuard({ enabled: Boolean(parsed) && !isFinished })

  useEffect(() => {
    if (isFinished) router.push(returnHref)
  }, [isFinished, returnHref, router])

  const rowCount = parsed?.rows.length ?? 0
  const recordCount = (count: number) => `${count.toLocaleString()} ${pluralize(count, entityLabel, entityLabelPlural).toLowerCase()}`
  const hasBlockingIssues = validation.blockingIssues.length > 0
  const canContinue = step === 'upload' ? Boolean(parsed) && rowCount > 0 && !isLoadingFields : !hasBlockingIssues

  const handleImport = async () => {
    setIsImporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      const file = toImportFile()
      if (!file) return

      await onImport(file)
      successNotification({
        title: `${entityLabelPlural} imported`,
        description: `${recordCount(rowCount)} imported from ${parsed?.fileName}.`,
      })
      setIsFinished(true)
    } catch (error) {
      errorNotification({ title: 'Import failed', description: parseErrorMessage(error) })
    } finally {
      setIsImporting(false)
    }
  }

  const footerHint = () => {
    if (step === 'upload') {
      if (!parsed) return 'Choose a file to continue'
      if (isLoadingFields) return `Loading the ${entityLabel.toLowerCase()} field reference…`
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
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="transparent" className="px-0 text-muted-foreground" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(returnHref)} disabled={isImporting}>
          {backLabel}
        </Button>
        <PageHeading heading={`Import ${entityLabelPlural.toLowerCase()}`} subheading="Upload your file and we'll help you map the columns to Openlane fields." />
      </div>

      <ImportStepNav current={step} />

      {isExampleError ? (
        <p className="py-10 text-center text-sm text-muted-foreground">The {entityLabel.toLowerCase()} field reference could not be loaded, so columns cannot be mapped. Please try again later.</p>
      ) : (
        <>
          {step === 'upload' && (
            <>
              <UploadStep
                entityLabel={entityLabel}
                parsed={parsed}
                onFileParsed={applyFile}
                requiredGroups={requiredGroups}
                isLoadingFields={isLoadingFields}
                fieldReferenceId={fieldReferenceId}
                isFieldReferenceOpen={isFieldReferenceOpen}
                onToggleFieldReference={() => setIsFieldReferenceOpen((open) => !open)}
              />
              {isFieldReferenceOpen && (
                <FieldReferencePanel id={fieldReferenceId} entityLabel={entityLabel} fields={fields} isLoading={isLoadingFields} exampleCsv={exampleCsv} exampleFilename={exampleFilename} />
              )}
            </>
          )}
          {step === 'map' && parsed && (
            <MappingStep
              entityLabel={entityLabel}
              entityLabelPlural={entityLabelPlural}
              columns={columns}
              fields={fields}
              hasRequirements={requiredGroups.length > 0}
              mapping={mapping}
              validation={validation}
              rowCount={rowCount}
              onColumnFieldChange={setColumnField}
            />
          )}
          {step === 'review' && parsed && <ReviewStep entityLabelPlural={entityLabelPlural} parsed={parsed} columns={columns} mapping={mapping} plan={plan} onEditMapping={() => goToStep('map')} />}
        </>
      )}

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t bg-secondary py-4 pr-10 after:absolute after:inset-x-0 after:top-full after:h-8 after:bg-secondary">
        <div className="mr-auto">
          {!isFirstStep && (
            <Button variant="outline" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={goBack} disabled={isImporting}>
              Back
            </Button>
          )}
        </div>
        <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {footerHint()}
        </span>
        {isLastStep ? (
          <Button variant="primary" onClick={handleImport} loading={isImporting} disabled={isImporting || isFinished || !parsed || hasBlockingIssues}>
            {isImporting ? 'Importing…' : `Import ${recordCount(rowCount)}`}
          </Button>
        ) : (
          <Button variant="primary" icon={<ArrowRight size={16} />} onClick={goNext} disabled={!canContinue}>
            Continue
          </Button>
        )}
      </div>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </div>
  )
}
