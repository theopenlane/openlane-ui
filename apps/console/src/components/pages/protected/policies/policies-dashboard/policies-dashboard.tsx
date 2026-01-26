'use client'

import React from 'react'
import StatusBreakdown from './status-breakdown'
import RecentActivity from './recent-activity'
import CoverageByType from './coverage-by-type'
import AwaitingApprovalTable from './tables/awaiting-approval-table'
import ReviewDueSoonTable from './tables/review-due-soon-table'
import PoliciesWithoutProceduresTable from './tables/policies-without-procedures-table'
import { StatusBreakdownSkeleton } from '@/components/pages/protected/policies/skeletons/status-breakdown-skeleton.tsx'
import { RecentActivitySkeleton } from '@/components/pages/protected/policies/skeletons/recent-activity-skeleton.tsx'
import { CoverageByTypeSkeleton } from '@/components/pages/protected/policies/skeletons/coverage-by-type-skeleton.tsx'
import { PolicyEmptyActions } from '@/components/pages/protected/policies/policies-empty/policy-empty.tsx'
import { Callout } from '@/components/shared/callout/callout.tsx'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs.ts'

type TPoliciesDashboardProps = {
  setActive: (tab: 'dashboard' | 'table') => void
  fetching: boolean
  totalCount: number
}

export default function PoliciesDashboard({ setActive, fetching, totalCount }: TPoliciesDashboardProps) {
  const isEmpty = !fetching && totalCount === 0
  const hasData = !fetching && totalCount > 0

  return (
    <div className="p-8 space-y-10">
      {fetching && (
        <>
          <div className="flex flex-col lg:flex-row gap-10">
            <StatusBreakdownSkeleton />
            <RecentActivitySkeleton />
          </div>
          <CoverageByTypeSkeleton />
        </>
      )}

      {isEmpty && (
        <section className="mx-auto max-w-5xl space-y-6">
          <p className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">
            No policies found. <span className="text-foreground font-medium">Create one now</span> using any option below.
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col gap-4 w-full md:w-2/4">
              <PolicyEmptyActions />
            </div>

            <div className="w-full md:w-2/4">
              <Callout variant="info" title="What are Policies?" className="self-stretch">
                <p className="mb-3">
                  Policies set the rules for how your organization operates securely and responsibly. They define expectations for behavior, outline required practices, and form the foundation for
                  your compliance program.
                </p>

                <p className="mb-2">
                  Having clear policies helps demonstrate compliance to auditors and regulators, ensure consistent security and operational standards across teams, and provide a basis for verifying
                  and improving your internal controls over time.
                </p>

                <p className="font-medium">Common examples include:</p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  <li className="mb-0">
                    <strong className="mr-0">Information Security Policy</strong> – defines how data is protected.
                  </li>
                  <li className="mb-0">
                    <strong className="mr-0">Access Control Policy</strong> – governs who can access systems and data.
                  </li>
                  <li className="mb-0">
                    <strong className="mr-0">Incident Response Policy</strong> – outlines how to respond to security events.
                  </li>
                  <li className="mb-0">
                    <strong className="mr-0">Acceptable Use Policy</strong> – sets expectations for using company systems.
                  </li>
                </ul>

                <a
                  href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/policy-and-procedure-management/policies`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-info)] underline underline-offset-4 hover:opacity-80"
                >
                  See docs to learn more.
                </a>
              </Callout>
            </div>
          </div>
        </section>
      )}

      {hasData && (
        <>
          <div className="flex flex-col lg:flex-row gap-10">
            <StatusBreakdown onStatusClick={() => setActive('table')} />
            <RecentActivity />
          </div>

          <CoverageByType onTypeClick={() => setActive('table')} />

          <AwaitingApprovalTable />
          <ReviewDueSoonTable />
          <PoliciesWithoutProceduresTable />
        </>
      )}
    </div>
  )
}
