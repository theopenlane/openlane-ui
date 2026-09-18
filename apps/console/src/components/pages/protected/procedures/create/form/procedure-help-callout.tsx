import { Callout } from '@/components/shared/callout/callout'
import { DocsLink } from '@/components/shared/docs-help/docs-link'
import { docsHelpQuery } from '@/components/shared/docs-help/docs-help-query'
import { POLICY_MANAGEMENT_DOCS_URL } from '@/constants/docs'

const POLICY_AND_PROCEDURE_TOPIC = {
  title: 'Policies and Procedures',
  query: docsHelpQuery('create', 'policies and procedures'),
  prefer: 'policy-and-procedure-management',
}

export const ProcedureHelpCallout = () => (
  <Callout variant="info" title="Need help getting started?">
    View our{' '}
    <DocsLink topic={POLICY_AND_PROCEDURE_TOPIC} href={`${POLICY_MANAGEMENT_DOCS_URL}/policies`} className="font-medium">
      documentation
    </DocsLink>{' '}
    on creating policies and procedures
  </Callout>
)
