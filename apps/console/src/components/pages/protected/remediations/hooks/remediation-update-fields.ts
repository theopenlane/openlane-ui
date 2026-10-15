import { type UpdateRemediationInput } from '@repo/codegen/src/schema'
import { associationsInput, orClear, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type RemediationFormData } from './use-form-schema'

export const REMEDIATION_UPDATE_FIELDS = {
  title: orClear('clearTitle'),
  summary: orClear('clearSummary'),
  explanation: orClear('clearExplanation'),
  instructions: orClear('clearInstructions'),
  intent: orClear('clearIntent'),
  state: orClear('clearState'),
  source: orClear('clearSource'),
  externalID: orClear('clearExternalID'),
  externalOwnerID: orClear('clearExternalOwnerID'),
  externalURI: orClear('clearExternalURI'),
  ownerReference: orClear('clearOwnerReference'),
  ticketReference: orClear('clearTicketReference'),
  pullRequestURI: orClear('clearPullRequestURI'),
  repositoryURI: orClear('clearRepositoryURI'),
  environmentName: orClear('clearEnvironmentName'),
  scopeName: orClear('clearScopeName'),
  controlIDs: associationsInput('controlIDs'),
  subcontrolIDs: associationsInput('subcontrolIDs'),
  findingIDs: associationsInput('findingIDs'),
  vulnerabilityIDs: associationsInput('vulnerabilityIDs'),
} satisfies TFieldMappers<RemediationFormData, UpdateRemediationInput>
