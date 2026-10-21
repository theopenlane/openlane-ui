import { googleDocumentsPicker } from './google-picker'
import { type IntegrationProvider, type TResourcePicker } from './types'

const GOOGLE_DRIVE_DEFINITION_ID = 'def_01K0GDRIVE00000000000000001'

const RESOURCE_PICKERS: Record<string, TResourcePicker> = {
  [GOOGLE_DRIVE_DEFINITION_ID]: googleDocumentsPicker,
}

export const resolveResourcePicker = (provider?: IntegrationProvider): TResourcePicker | undefined =>
  provider && Object.hasOwn(RESOURCE_PICKERS, provider.id) ? RESOURCE_PICKERS[provider.id] : undefined
