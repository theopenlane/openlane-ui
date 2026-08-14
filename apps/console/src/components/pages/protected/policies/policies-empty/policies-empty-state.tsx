import React from 'react'
import { PolicyEmptyActions } from '@/components/pages/protected/policies/policies-empty/policy-empty.tsx'

const PoliciesEmptyState = () => {
  return (
    <div className="p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <p className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">
          No policies found. <span className="text-foreground font-medium">Create one now</span> using any option below.
        </p>

        <div className="flex flex-col gap-4 w-full">
          <PolicyEmptyActions />
        </div>
      </section>
    </div>
  )
}

export default PoliciesEmptyState
