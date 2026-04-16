'use client'

import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { ExternalLink, PanelRightClose } from 'lucide-react'
import { useIdentityHolder, type IdentityHoldersNodeNonNull } from '@/lib/graphql-hooks/identity-holder'
import { IdentityHolderUserStatus, IdentityHolderIdentityHolderType, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { GenericDetailsSheet, type GenericDetailsSheetConfig, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { normalizeEntityData } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import useFormSchema, { type EditPersonnelFormData } from './hooks/use-form-schema'
import { getFieldsToRender } from './table/table-config'
import { type PersonnelFieldProps } from './table/types'

type Props = {
  identityHolderId: string | null
  onClose: () => void
}

const statusOptions = enumToOptions(IdentityHolderUserStatus)
const identityHolderTypeOptions = enumToOptions(IdentityHolderIdentityHolderType)

const ViewPersonnelSheet: React.FC<Props> = ({ identityHolderId, onClose }) => {
  const router = useRouter()
  const { form } = useFormSchema()
  const { data, isLoading } = useIdentityHolder(identityHolderId || undefined)

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { tagOptions } = useGetTags()

  const enumOpts = useMemo(
    () => ({
      statusOptions,
      identityHolderTypeOptions,
      environmentOptions,
      scopeOptions,
      tagOptions,
    }),
    [environmentOptions, scopeOptions, tagOptions],
  )

  const enumCreateHandlers = useMemo(
    () => ({
      environmentName: createEnvironment,
      scopeName: createScope,
    }),
    [createEnvironment, createScope],
  )

  const normalizeData = useCallback(
    (d: IdentityHoldersNodeNonNull): Partial<EditPersonnelFormData> =>
      normalizeEntityData(d, {
        internalOwner: { user: d?.internalOwnerUser, group: d?.internalOwnerGroup, stringValue: d?.internalOwner },
      }) as Partial<EditPersonnelFormData>,
    [],
  )

  const renderHeader = useCallback(
    ({ close }: RenderHeaderProps) => (
      <SheetHeader>
        <SheetTitle className="sr-only">Personnel</SheetTitle>
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
                if (identityHolderId) {
                  close()
                  router.push(`/registry/personnel/${identityHolderId}`)
                }
              }}
            >
              Open in Full
            </Button>
          </div>
        </div>
      </SheetHeader>
    ),
    [identityHolderId, router],
  )

  const renderFields = useCallback(
    (props: PersonnelFieldProps) => {
      return getFieldsToRender(props, enumOpts, undefined, undefined, enumCreateHandlers)
    },
    [enumOpts, enumCreateHandlers],
  )

  const sheetConfig: GenericDetailsSheetConfig<EditPersonnelFormData, IdentityHoldersNodeNonNull, UpdateIdentityHolderInput, unknown, unknown, unknown> = {
    objectType: ObjectTypes.IDENTITY_HOLDER,
    form,
    entityId: identityHolderId,
    isCreateMode: false,
    basePath: '/registry/personnel',
    data: identityHolderId ? (data?.identityHolder as IdentityHoldersNodeNonNull | undefined) : undefined,
    isFetching: isLoading,
    onClose,
    normalizeData,
    renderFields,
    renderHeader,
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewPersonnelSheet
