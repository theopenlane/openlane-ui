'use client'

import { buildResponsibilityCreatePayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useControlLinksForFinding } from '@/components/shared/object-association/finding-control-links'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useBulkDeleteFinding, useCreateFinding } from '@/lib/graphql-hooks/finding'
import { type CreateFindingInput } from '@repo/codegen/src/schema'
import { FINDING_ASSIGNEE, FINDING_INTERNAL_OWNER, FINDING_REVIEWER } from '../finding-responsibility'
import { getFindingTitle } from '../finding-display'
import { getFieldsToRender } from '../table/table-config'
import { type EnumOptions, type FindingFieldProps, type FindingSheetConfig, objectType } from '../table/types'
import { buildFindingCreateAssociations, getFindingControlLinks, omitAssociationKeys } from './use-finding-association-split'
import useFormSchema from './use-form-schema'

export const useFindingCreateSheetConfig = (isCreate: boolean): Omit<FindingSheetConfig, 'onClose'> & { enumOpts: EnumOptions } => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()
  const syncControlLinks = useControlLinksForFinding(undefined)

  const baseCreateMutation = useCreateFinding()
  const baseBulkDeleteMutation = useBulkDeleteFinding()

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateFindingInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkFinding
    },
  }

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { enumOptions: findingStatusOptions, onCreateOption: createFindingStatus } = useCreatableEnumOptions({ objectType: 'finding', field: 'status' })

  const enumOpts = { environmentOptions, scopeOptions, findingStatusOptions }
  const enumCreateHandlers = { environmentName: createEnvironment, scopeName: createScope, findingStatusName: createFindingStatus }

  return {
    enumOpts,
    objectType,
    form,
    entityId: null,
    isCreateMode: isCreate,
    isFetching: false,
    createMutation,
    deleteMutation,
    buildPayload: async (formData) => {
      const { internalOwner, assignedTo, reviewedBy, ...rest } = omitAssociationKeys(formData)
      const description = (await plateToHtmlOrNull(rest.description, plateEditorHelper)) ?? undefined
      const cleaned = Object.fromEntries(Object.entries({ ...rest, description }).filter(([, v]) => v !== '' && v !== undefined))
      return {
        ...cleaned,
        ...buildFindingCreateAssociations(formData),
        ...buildResponsibilityCreatePayload(FINDING_INTERNAL_OWNER, internalOwner),
        ...buildResponsibilityCreatePayload(FINDING_ASSIGNEE, assignedTo),
        ...buildResponsibilityCreatePayload(FINDING_REVIEWER, reviewedBy),
      }
    },
    onSaved: async ({ formData, created }) => {
      const findingID = created?.createFinding?.finding?.id
      if (!findingID || !formData.controlIDs) return
      await syncControlLinks(findingID, getFindingControlLinks([], formData.controlIDs))
    },
    getName: getFindingTitle,
    renderFields: (props: FindingFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }
}
