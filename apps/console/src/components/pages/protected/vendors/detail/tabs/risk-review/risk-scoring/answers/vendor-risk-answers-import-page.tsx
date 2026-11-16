'use client'

import React, { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage, RecordImportUnavailable } from '@/components/shared/record-import/record-import-page'
import { RecordImportSkeleton } from '@/components/shared/record-import/import-page-gate'
import { IMPORT_ROUTES, vendorRiskAnswersImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { serializeCsv } from '@/components/shared/record-import/lib/delimited-file'
import { IncompleteImportError } from '@/components/shared/record-import/lib/incomplete-import-error'
import { type TImportOutcome, type TMappedImport } from '@/components/shared/record-import/lib/types'
import { useEntity, vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { useOrganizationVendorScoringConfig } from '@/lib/graphql-hooks/vendor-scoring-config'
import { useCreateBulkCSVVendorRiskScore, useUpdateBulkCSVVendorRiskScore, useVendorRiskScoring } from '@/lib/graphql-hooks/vendor-risk-score'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { buildRiskQuestions } from './risk-answers'
import { planRiskAnswerImport, toCreateCsv, toUpdateCsv } from './risk-answers-csv'
import { riskAnswersImportDestination } from './risk-answers-import-destination'

const MAX_LISTED_ERRORS = 5

const toCsvFile = ({ headers, rows }: { headers: string[]; rows: string[][] }, name: string) => new File([serializeCsv(headers, rows)], name, { type: 'text/csv' })

const VendorRiskAnswersImportPage: React.FC<{ vendorId: string }> = ({ vendorId }) => {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useEntity(vendorId)
  const { data: permission, isPending: isPermissionPending } = useAccountRoles(ObjectTypes.ENTITY, vendorId)
  const { questions, parsedConfig, isPending: isConfigPending, isResolved: isConfigResolved } = useOrganizationVendorScoringConfig()
  const { refetch: refetchScores } = useVendorRiskScoring(vendorId)
  const { mutateAsync: createBulk } = useCreateBulkCSVVendorRiskScore()
  const { mutateAsync: updateBulk } = useUpdateBulkCSVVendorRiskScore()
  const destination = useMemo(() => riskAnswersImportDestination(buildRiskQuestions(questions, [])), [questions])

  const vendor = data?.entity

  if (isPending || isConfigPending) return <RecordImportSkeleton />

  if (isError || !vendor) {
    return <RecordImportUnavailable message={<p>Vendor not found.</p>} backHref={IMPORT_ROUTES[ObjectTypes.ENTITY].listHref} backLabel="Back to Vendors" />
  }

  const route = vendorRiskAnswersImportRoute(vendorId, vendorDisplayName(vendor))

  if (!isConfigResolved || parsedConfig === null) {
    return (
      <RecordImportUnavailable
        message={<p>Vendor scoring settings could not be loaded, so answers cannot be imported right now. Please try again later.</p>}
        backHref={route.listHref}
        backLabel="Back to vendor"
      />
    )
  }

  const handleImport = async (mapped: TMappedImport): Promise<TImportOutcome> => {
    const { data: scores, error } = await refetchScores()
    if (error || !scores) throw new UserFacingError("Could not load this vendor's current answers. Please try again later.", { cause: error })

    const plan = planRiskAnswerImport(mapped.toRecords(), buildRiskQuestions(questions, scores))
    if (plan.errors.length > 0) {
      const more = plan.errors.length > MAX_LISTED_ERRORS ? ` And ${pluralizeWithCount(plan.errors.length - MAX_LISTED_ERRORS, 'more row')}.` : ''
      throw new UserFacingError(`${plan.errors.slice(0, MAX_LISTED_ERRORS).join(' ')}${more}`)
    }
    const answerCount = plan.creates.length + plan.updates.length
    if (answerCount === 0) throw new UserFacingError('The file has no answers to import.')

    let savedCount = 0
    try {
      if (plan.creates.length > 0) {
        await createBulk({ input: toCsvFile(toCreateCsv(vendorId, plan.creates), 'risk-answers-new.csv') })
        savedCount += plan.creates.length
      }
      if (plan.updates.length > 0) {
        const updated = await updateBulk({ input: toCsvFile(toUpdateCsv(plan.updates), 'risk-answers-updated.csv') })
        savedCount += updated.updateBulkCSVVendorRiskScore.updatedIDs?.length ?? 0
      }
    } catch (error) {
      if (savedCount === 0) throw error
    } finally {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScoreHistories', vendorId] })
    }

    if (savedCount < answerCount) {
      throw new IncompleteImportError(
        'Some answers were not saved',
        `${pluralizeWithCount(savedCount, 'answer')} saved; ${pluralizeWithCount(answerCount - savedCount, 'answer')} could not be saved. Import the file again to retry them: saved answers are updated, not duplicated.`,
      )
    }
    return { importedCount: savedCount }
  }

  return (
    <RecordImportPage entityType={ObjectTypes.VENDOR_RISK_SCORE} route={route} roles={{ roles: permission?.roles, isPending: isPermissionPending }} destination={destination} onImport={handleImport} />
  )
}

export default VendorRiskAnswersImportPage
