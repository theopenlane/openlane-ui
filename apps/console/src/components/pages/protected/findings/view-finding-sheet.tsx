'use client'

import React, { useCallback } from 'react'
import CommentsSection from '@/components/shared/comments/comments-section'
import { GenericDetailsSheet, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { SlideoutPreviewHeader } from '@/components/shared/crud-base/slideout-preview-header'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useFinding, useFindingComments } from '@/lib/graphql-hooks/finding'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { getFindingTitle } from './finding-display'
import { normalizeFindingData } from './finding-responsibility'
import useFormSchema from './hooks/use-form-schema'
import { getFieldsToRender } from './table/table-config'
import { type FindingFieldProps, type FindingSheetConfig, objectType } from './table/types'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewFindingSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useFinding(entityId || undefined)
  const comments = useFindingComments(entityId)
  const { enumOptions: environmentOptions } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions } = useCreatableEnumOptions({ field: 'scope' })
  const { enumOptions: findingStatusOptions } = useCreatableEnumOptions({ objectType: 'finding', field: 'status' })

  const enumOpts = { environmentOptions, scopeOptions, findingStatusOptions }

  const renderHeader = useCallback(
    ({ close }: RenderHeaderProps) => <SlideoutPreviewHeader title="Finding" close={close} fullPagePath={entityId ? getHrefForObjectType('findings', { id: entityId }) : null} />,
    [entityId],
  )

  const sheetConfig: FindingSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.finding : undefined,
    isFetching: isLoading,
    onClose,
    normalizeData: normalizeFindingData,
    getName: getFindingTitle,
    renderHeader,
    renderFields: (props: FindingFieldProps) => getFieldsToRender(props, enumOpts),
    extraContent: entityId ? <CommentsSection key={entityId} {...comments} /> : undefined,
  }

  return <GenericDetailsSheet {...sheetConfig} />
}

export default ViewFindingSheet
