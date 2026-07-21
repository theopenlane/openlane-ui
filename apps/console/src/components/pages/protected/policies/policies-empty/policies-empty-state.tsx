import React from 'react'
import { PolicyEmptyActions } from '@/components/pages/protected/policies/policies-empty/policy-empty.tsx'
import { Callout } from '@/components/shared/callout/callout.tsx'
import { POLICY_MANAGEMENT_DOCS_URL } from '@/constants/docs.ts'

const PoliciesEmptyState = () => {
  return (
    <div className="p-8">
      <section className="mx-auto max-w-7xl space-y-6">
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
                Policies set the rules for how your organization operates securely and responsibly. They define expectations for behavior, outline required practices, and form the foundation for your
                compliance program.
              </p>

              <p className="mb-2">
                Having clear policies helps demonstrate compliance to auditors and regulators, ensure consistent security and operational standards across teams, and provide a basis for verifying and
                improving your internal controls over time.
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

              <a href={`${POLICY_MANAGEMENT_DOCS_URL}/policies`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-info)] underline underline-offset-4 hover:opacity-80">
                See docs to learn more.
              </a>
            </Callout>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PoliciesEmptyState
