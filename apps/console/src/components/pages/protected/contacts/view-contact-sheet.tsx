'use client'

import React, { useCallback, useMemo } from 'react'
import { useContact } from '@/lib/graphql-hooks/contact'
import { ContactUserStatus } from '@repo/codegen/src/schema'
import { GenericDetailsSheet, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { SlideoutPreviewHeader } from '@/components/shared/crud-base/slideout-preview-header'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import useFormSchema from './hooks/use-form-schema'
import { getFieldsToRender } from './table/table-config'
import { objectType, type ContactFieldProps, type ContactSheetConfig } from './table/types'

type Props = {
  contactId: string | null
  onClose: () => void
}

const statusOptions = enumToOptions(ContactUserStatus)

const ViewContactSheet: React.FC<Props> = ({ contactId, onClose }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useContact(contactId || undefined)
  const { tagOptions } = useGetTags()

  const enumOpts = useMemo(() => ({ statusOptions, tagOptions }), [tagOptions])

  const renderHeader = useCallback(
    ({ close }: RenderHeaderProps) => (
      <SlideoutPreviewHeader title="Contact" close={close} fullPagePath={contactId ? getHrefForObjectType(ObjectAssociationNodeEnum.CONTACT, { id: contactId }) : null} />
    ),
    [contactId],
  )

  const renderFields = useCallback((props: ContactFieldProps) => getFieldsToRender(props, enumOpts), [enumOpts])

  const sheetConfig: ContactSheetConfig = {
    objectType,
    form,
    entityId: contactId,
    isCreateMode: false,
    basePath: '/registry/contacts',
    data: contactId ? data?.contact : undefined,
    isFetching: isLoading,
    onClose,
    renderFields,
    renderHeader,
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewContactSheet
