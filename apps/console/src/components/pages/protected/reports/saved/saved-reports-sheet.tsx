'use client'

import React, { useMemo } from 'react'
import { FileText, LoaderCircle, Search as SearchIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Sheet, SheetContent, SheetDescription } from '@repo/ui/sheet'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { type TSavedReportRef, useGetSavedReportsInfinite } from '@/lib/graphql-hooks/report'
import { savedReportDataLabel, savedReportOwnerId, savedReportsEmptyMessage } from '@/lib/report/saved-report'
import { ReportVisibilityBadge } from './report-visibility'
import { SavedReportOwner } from './saved-report-owner'
import { SavedReportMenu, useSavedReportActions } from './use-saved-report-actions'

type TSavedReportsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenReport: (report: TSavedReportRef, options: { run: boolean }) => void
  onDeleted: (id: string) => void
}

const SavedReportsList: React.FC<Omit<TSavedReportsSheetProps, 'open'>> = ({ onOpenChange, onOpenReport, onDeleted }) => {
  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { reports, totalCount, error, isPending, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage } = useGetSavedReportsInfinite(debouncedTerm)

  useQueryErrorNotification({ error, description: 'Failed to load saved reports' })

  const reportIds = useMemo(() => reports.map((report) => report.id), [reports])
  const { authorMaps } = useAuthorMaps(reports.map(savedReportOwnerId))
  const isSearching = getIsSearching(isFetching && !isFetchingNextPage)

  const openReport = (report: TSavedReportRef, run: boolean) => {
    onOpenReport(report, { run })
    onOpenChange(false)
  }

  const { menuActionsFor, dialogs } = useSavedReportActions({ reportIds, onEdit: (report) => openReport(report, false), onDeleted })

  return (
    <div className="flex flex-col gap-3">
      <Input
        icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
        placeholder="Search reports"
        aria-label="Search reports"
        value={searchText}
        onChange={(event) => setSearchText(event.currentTarget.value)}
      />

      {isPending && <SkeletonRows count={5} height={64} />}

      {!isPending && reports.length === 0 && <EmptyTabState description={savedReportsEmptyMessage(debouncedTerm, !!error)} />}

      <ul className="flex flex-col gap-2">
        {reports.map((report) => (
          <li key={report.id}>
            <div className="flex items-center gap-2 rounded-md border pr-3 transition-colors hover:bg-muted/50">
              <Button
                type="button"
                variant="transparent"
                className="h-auto min-w-0 flex-1 justify-start overflow-hidden border-none p-3 text-left hover:bg-transparent *:w-full *:min-w-0"
                onClick={() => openReport(report, true)}
              >
                <span className="flex w-full min-w-0 items-center gap-3">
                  <FileText size={16} className="shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-normal">{report.name}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-normal text-muted-foreground">{savedReportDataLabel(report.variables)}</span>
                      <ReportVisibilityBadge visibility={report.visibility} />
                      <SavedReportOwner report={report} authorMaps={authorMaps} className="text-xs font-normal text-muted-foreground" avatarClassName="h-4 w-4" />
                    </span>
                  </span>
                </span>
              </Button>
              <SavedReportMenu reportName={report.name} actions={menuActionsFor(report)} />
            </div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <Button type="button" variant="secondary" loading={isFetchingNextPage} disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
          Load more ({reports.length} of {totalCount})
        </Button>
      )}

      {dialogs}
    </div>
  )
}

const SavedReportsSheet: React.FC<TSavedReportsSheetProps> = ({ open, onOpenChange, onOpenReport, onDeleted }) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      minWidth={380}
      initialWidth={460}
      header={<SlideoutHeader title="Saved reports" belowTitle={<SheetDescription>Manage and reuse your saved report configurations.</SheetDescription>} onClose={() => onOpenChange(false)} />}
    >
      <SavedReportsList onOpenChange={onOpenChange} onOpenReport={onOpenReport} onDeleted={onDeleted} />
    </SheetContent>
  </Sheet>
)

export default SavedReportsSheet
