import { type UpdateRemediationInput } from '@repo/codegen/src/schema'
import { omit, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type RemediationFormData } from './use-form-schema'

export const REMEDIATION_UPDATE_FIELDS = {
  contextType: omit,
  contextId: omit,
  title: orClear('clearTitle'),
  status: orClear('clearStatus'),
  explanation: richTextOrClear('clearExplanation'),
  instructions: richTextOrClear('clearInstructions'),
  intent: richTextOrClear('clearIntent'),
  environmentName: orClear('clearEnvironmentName'),
  scopeName: orClear('clearScopeName'),
  repositoryURI: orClear('clearRepositoryURI'),
  pullRequestURI: orClear('clearPullRequestURI'),
  ticketReference: orClear('clearTicketReference'),
  externalURI: orClear('clearExternalURI'),
  fileIDs: omit,
  uploads: omit,
} satisfies TFieldMappers<RemediationFormData, UpdateRemediationInput>
