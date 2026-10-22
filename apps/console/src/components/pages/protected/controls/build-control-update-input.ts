import { type Value } from 'platejs'
import { type UpdateControlInput, type UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { isEmptyInputValue, omit, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'

export type TControlFormValues = {
  refCode: string
  title: string
  description: Value | string
  descriptionJSON?: Value
  publicRepresentation?: Value | string
  delegateID: string
  controlOwnerID: string
  responsiblePartyID: string
  category?: string
  subcategory?: string
  mappedCategories: string[]
  referenceID?: string
  auditorReferenceID?: string
  sourceName?: string
}

type TSharedControlInput = UpdateControlInput & UpdateSubcontrolInput

export const buildControlUpdateFields = (isSourceFramework: boolean) =>
  ({
    refCode: (refCode) => (isSourceFramework || isEmptyInputValue(refCode) ? {} : { refCode }),
    title: isSourceFramework ? omit : orClear('clearTitle'),
    description: omit,
    descriptionJSON: isSourceFramework
      ? omit
      : async (descriptionJSON, _values, { converter }) => {
          if (descriptionJSON === undefined) {
            return {}
          }

          const description = await plateToHtmlOrNull(descriptionJSON, converter)
          return description ? { descriptionJSON, description } : { clearDescription: true, clearDescriptionJSON: true }
        },
    publicRepresentation: richTextOrClear('clearPublicRepresentation'),
    delegateID: orClear('clearDelegate'),
    controlOwnerID: orClear('clearControlOwner'),
    responsiblePartyID: orClear('clearResponsibleParty'),
    category: orClear('clearCategory'),
    subcategory: orClear('clearSubcategory'),
    mappedCategories: orClear('clearMappedCategories'),
    referenceID: orClear('clearReferenceID'),
    auditorReferenceID: orClear('clearAuditorReferenceID'),
    sourceName: orClear('clearSourceName'),
  }) satisfies TFieldMappers<TControlFormValues, TSharedControlInput>
