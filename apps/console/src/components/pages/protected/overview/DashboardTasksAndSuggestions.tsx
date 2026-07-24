'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { PartyPopper, TriangleAlert } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import SuggestedTaskDetailsSheet from '@/components/pages/protected/overview/suggested-task-details-sheet'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ALL_FILTER_KEY, FILTER_LABELS } from './work-items/types'
import { useWorkItems } from './work-items/use-work-items'
import WorkItemSection from './work-items/work-item-section'
import ApprovalsSection from './work-items/approvals-section'
import EvidenceRequestsSection from './work-items/evidence-requests-section'
import FilterBar from './work-items/filter-bar'

const WORK_ITEM_SKELETON_ROWS = [0, 1, 2, 3]

const DashboardTasksAndSuggestions = () => {
  const workItems = useWorkItems()
  const showSectionHeaders = workItems.activeFilter === ALL_FILTER_KEY

  return (
    <Card className="bg-homepage-card border-homepage-card-border h-full">
      <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold">Your Work</CardTitle>
      <CardDescription className="pt-1 pb-3">Tasks, recommendations, evidence requests, and notifications that need your attention</CardDescription>

      {!workItems.isLoading && !workItems.error && !workItems.isEmpty && (
        <FilterBar
          filters={workItems.availableFilters}
          activeFilter={workItems.activeFilter}
          onFilterChange={workItems.setActiveFilter}
          groupBy={workItems.groupBy}
          onGroupByChange={workItems.setGroupBy}
        />
      )}

      <CardContent className="px-6 pb-6 pt-4 space-y-5">
        {workItems.isLoading ? (
          <div className="space-y-3">
            {WORK_ITEM_SKELETON_ROWS.map((row) => (
              <Skeleton key={row} height={56} className="w-full rounded-lg" />
            ))}
          </div>
        ) : workItems.error ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <TriangleAlert className="text-destructive" size={20} />
            <p className="text-sm text-muted-foreground">{parseErrorMessage(workItems.error)}</p>
          </div>
        ) : (
          <>
            {workItems.groupBy === 'type' ? (
              <>
                {workItems.showRecommendations && <WorkItemSection label={FILTER_LABELS.recommendations} items={workItems.recommendationWorkItems} showHeader={showSectionHeaders} />}
                {workItems.showTasks && <WorkItemSection label={FILTER_LABELS.tasks} items={workItems.taskWorkItems} showHeader={showSectionHeaders} showKindLabel />}
              </>
            ) : (
              workItems.visibleKindGroups.map(([kind, items]) => <WorkItemSection key={kind} label={kind} items={items} showHeader={showSectionHeaders} />)
            )}

            {workItems.showApprovals && (
              <ApprovalsSection notifications={workItems.approvalNotifications} showHeader={showSectionHeaders} onOpen={workItems.openNotification} onDismiss={workItems.dismissNotification} />
            )}

            {workItems.showEvidenceRequests && <EvidenceRequestsSection evidenceRequests={workItems.evidenceRequests} showHeader={showSectionHeaders} />}

            {workItems.isEmpty && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <PartyPopper className="text-homepage-action-icon" size={20} />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <TaskDetailsSheet entityId={workItems.selectedTaskId} onClose={workItems.clearSelectedTask} />
      <SuggestedTaskDetailsSheet task={workItems.selectedSuggestion} onClose={workItems.clearSelectedSuggestion} onComplete={workItems.dismissSuggestion} />
    </Card>
  )
}

export default DashboardTasksAndSuggestions
