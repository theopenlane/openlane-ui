'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useNotification } from '@/hooks/useNotification'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { isRecord } from '@/utils/type-guards'
import { SCANS_ROUTE } from '@/constants/scan-routes'
import { useUpdateScan } from '@/lib/graphql-hooks/scan'
import { invalidateFindingControlQueries } from '@/lib/graphql-hooks/finding-control'
import { invalidateCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { type ReportScanExistingIds } from '@/lib/graphql-hooks/report-scan'
import { clearScanProgress, loadScanProgress, saveScanProgress } from '../../shared/scan-progress-storage'
import { buildImportPlan } from '../import/build-import-plan'
import { emptyImportProgress, ReportScanImportError, runReportScanImport, type ReportScanCreatedSection, type ReportScanImportPlan, type ReportScanImportProgress } from '../import/run-report-import'
import type { ReportScanState } from './use-report-scan-state'
import { REPORT_SECTION_IDS, type ParsedReport, type ReportProgramChoice } from '../types'

const IMPORTED_QUERY_KEYS = ['scans', 'programs', 'entities', 'assets', 'platforms', 'systemDetails', 'groups', 'reviews']

const COUNT_NOUNS: [ReportScanCreatedSection, string][] = [
  ['platforms', 'platform'],
  ['systems', 'system'],
  ['vendors', 'vendor'],
  ['assets', 'asset'],
  ['groups', 'group'],
  ['controls', 'control'],
  ['reviews', 'review'],
  ['findings', 'finding'],
]

const importProgressStorageKey = (scanId: string) => `report-scan-import-progress:v1:${scanId}`

const loadImportProgress = (scanId: string): ReportScanImportProgress => {
  const saved = loadScanProgress<Partial<ReportScanImportProgress>>(importProgressStorageKey(scanId))
  const empty = emptyImportProgress()
  if (!isRecord(saved) || !isRecord(saved.created)) return empty
  return { ...empty, ...saved, created: { ...empty.created, ...saved.created } }
}

const describeProgress = (progress: ReportScanImportProgress) =>
  [
    ...(progress.programId ? ['a program'] : []),
    ...COUNT_NOUNS.map(([section, noun]) => [Object.keys(progress.created[section]).length, noun] as const)
      .filter(([count]) => count > 0)
      .map(([count, noun]) => pluralizeWithCount(count, noun)),
  ].join(', ')

type UseReportScanImportArgs = {
  scanId: string
  report: ParsedReport
  state: ReportScanState
  program: ReportProgramChoice
  existing: ReportScanExistingIds
  soc2StandardId?: string
  programName: string
}

export const useReportScanImport = ({ scanId, report, state, program, existing, soc2StandardId, programName }: UseReportScanImportArgs) => {
  const router = useRouter()
  const { data: session } = useSession()
  const { client, queryClient } = useGraphQLClient()
  const { successNotification, errorNotification } = useNotification()
  const { mutate: markScanReviewed } = useUpdateScan()
  const { mutateAsync: importReport, isPending: isImporting } = useMutation<ReportScanImportProgress, ReportScanImportError, ReportScanImportPlan>({
    mutationFn: (plan) => {
      const progress = loadImportProgress(scanId)
      return runReportScanImport(client, plan, progress, () => saveScanProgress(importProgressStorageKey(scanId), progress))
    },
    onSettled: () => {
      IMPORTED_QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      invalidateFindingControlQueries(queryClient)
      invalidateCustomTypeEnums(queryClient)
    },
  })

  const canImport = program.create || REPORT_SECTION_IDS.some((section) => state.selection[section].size > 0)

  const handleImport = async () => {
    const plan = buildImportPlan({
      report,
      scanId,
      selection: state.selection,
      platformOverrides: state.platformOverrides,
      systemOverrides: state.systemOverrides,
      program,
      programName,
      soc2StandardId,
      existing,
    })

    try {
      const progress = await importReport(plan)
      const summary = describeProgress(progress)

      successNotification({
        title: 'Import complete',
        description: summary ? `Added ${summary} to Openlane.` : 'Everything you selected was already in Openlane, so nothing new was created.',
      })

      state.clearProgress()
      clearScanProgress(importProgressStorageKey(scanId))

      const reviewedByUserID = session?.user?.userId
      if (reviewedByUserID) {
        markScanReviewed({ updateScanId: scanId, input: { reviewedByUserID } })
      }

      router.push(progress.programId ? getHrefForObjectType('programs', { id: progress.programId }) : SCANS_ROUTE)
    } catch (error) {
      if (error instanceof ReportScanImportError) {
        const created = describeProgress(error.progress)
        const reason = parseErrorMessage(error.cause).replace(/([^.!?])$/, '$1.')
        errorNotification({
          title: `Import stopped while creating ${error.stage}`,
          description: `${reason}${created ? ` Already added: ${created}. Importing again picks up where this left off.` : ' Please try again later.'}`,
        })
        return
      }

      errorNotification({ title: 'Import failed', description: parseErrorMessage(error) })
    }
  }

  return { handleImport, isImporting, canImport }
}
