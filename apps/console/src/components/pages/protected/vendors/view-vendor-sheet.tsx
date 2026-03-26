'use client'

import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { ExternalLink, PanelRightClose } from 'lucide-react'
import { useEntity } from '@/lib/graphql-hooks/entity'
import { EntityEntityStatus, EntityFrequency, type UpdateEntityInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { GenericDetailsSheet, type GenericDetailsSheetConfig, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { type EntitiesNodeNonNull } from '@/lib/graphql-hooks/entity'
import { normalizeEntityData } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import useFormSchema, { type EditVendorFormData } from './hooks/use-form-schema'
import { getFieldsToRender } from './table/table-config'
import { type EntityFieldProps } from './table/types'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewVendorSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const router = useRouter()
  const { form } = useFormSchema()
  const { data, isLoading } = useEntity(entityId || undefined)

  const { enumOptions: securityQuestionnaireStatusOptions, onCreateOption: createSecurityQuestionnaireStatus } = useCreatableEnumOptions({
    objectType: 'entity',
    field: 'entitySecurityQuestionnaireStatus',
  })
  const { enumOptions: sourceTypeOptions, onCreateOption: createSourceType } = useCreatableEnumOptions({
    objectType: 'entity',
    field: 'entitySourceType',
  })
  const { enumOptions: relationshipStateOptions, onCreateOption: createRelationshipState } = useCreatableEnumOptions({
    objectType: 'entity',
    field: 'relationshipState',
  })
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const reviewFrequencyOptions = enumToOptions(EntityFrequency)
  const entityStatusOptions = enumToOptions(EntityEntityStatus)
  const { tagOptions } = useGetTags()

  const enumOpts = useMemo(
    () => ({
      relationshipStateOptions,
      securityQuestionnaireStatusOptions,
      sourceTypeOptions,
      environmentOptions,
      scopeOptions,
      reviewFrequencyOptions,
      entityStatusOptions,
      tagOptions,
    }),
    [relationshipStateOptions, securityQuestionnaireStatusOptions, sourceTypeOptions, environmentOptions, scopeOptions, reviewFrequencyOptions, entityStatusOptions, tagOptions],
  )

  const enumCreateHandlers = useMemo(
    () => ({
      entitySourceTypeName: createSourceType,
      entityRelationshipStateName: createRelationshipState,
      entitySecurityQuestionnaireStatusName: createSecurityQuestionnaireStatus,
      environmentName: createEnvironment,
      scopeName: createScope,
    }),
    [createSourceType, createRelationshipState, createSecurityQuestionnaireStatus, createEnvironment, createScope],
  )

  const normalizeData = useCallback(
    (d: EntitiesNodeNonNull): Partial<EditVendorFormData> =>
      normalizeEntityData(d, {
        internalOwner: { user: d?.internalOwnerUser, group: d?.internalOwnerGroup, stringValue: d?.internalOwner },
        reviewedBy: { user: d?.reviewedByUser, group: d?.reviewedByGroup, stringValue: d?.reviewedBy },
      }) as Partial<EditVendorFormData>,
    [],
  )

  const renderHeader = useCallback(
    ({ close }: RenderHeaderProps) => (
      <SheetHeader>
        <SheetTitle className="sr-only">Vendor</SheetTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PanelRightClose size={16} className="cursor-pointer" onClick={close} />
          </div>
          <div className="flex items-center gap-2 mr-6">
            <Button
              variant="secondary"
              icon={<ExternalLink />}
              iconPosition="left"
              onClick={() => {
                if (entityId) router.push(`/registry/vendors/${entityId}`)
              }}
            >
              Open Full
            </Button>
          </div>
        </div>
      </SheetHeader>
    ),
    [entityId, router],
  )

  const renderFields = useCallback(
    (props: EntityFieldProps) => {
      return getFieldsToRender(props, enumOpts, undefined, undefined, enumCreateHandlers)
    },
    [enumOpts, enumCreateHandlers],
  )

  const sheetConfig: GenericDetailsSheetConfig<EditVendorFormData, EntitiesNodeNonNull, UpdateEntityInput, unknown, unknown, unknown> = {
    objectType: ObjectTypes.ENTITY,
    form,
    entityId,
    isCreateMode: false,
    basePath: '/registry/vendors',
    data: entityId ? (data?.entity as EntitiesNodeNonNull | undefined) : undefined,
    isFetching: isLoading,
    onClose,
    normalizeData,
    renderFields,
    renderHeader,
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewVendorSheet
