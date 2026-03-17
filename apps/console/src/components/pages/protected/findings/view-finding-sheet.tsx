'use client'

import React from 'react'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { useFindingSheetConfig } from './hooks/use-finding-sheet-config'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewFindingSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const sheetConfig = useFindingSheetConfig(entityId)
  return <GenericDetailsSheet onClose={onClose} basePath="/exposure/findings" {...sheetConfig} />
}

export default ViewFindingSheet
