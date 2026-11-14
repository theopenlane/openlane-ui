import { googleDocumentsPicker } from './google-picker'
import { type IntegrationProvider, type TResourcePicker } from './types'
import { IntegrationDefinitionID } from '@/lib/enums/integration'

const RESOURCE_PICKERS: Record<string, TResourcePicker> = {
  [IntegrationDefinitionID.GOOGLE_DRIVE]: googleDocumentsPicker,
}

export const resolveResourcePicker = (provider?: IntegrationProvider): TResourcePicker | undefined =>
  provider && Object.hasOwn(RESOURCE_PICKERS, provider.id) ? RESOURCE_PICKERS[provider.id] : undefined
