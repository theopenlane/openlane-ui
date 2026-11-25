'use client'

import React from 'react'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { useSystemDetailSheetBase } from './hooks/use-system-detail-sheet-base'
import { type SystemDetailSheetConfig } from './table/types'

type TViewSystemDetailSheetProps = {
  systemDetailId: string
  onClose: () => void
}

const ViewSystemDetailSheet: React.FC<TViewSystemDetailSheetProps> = ({ systemDetailId, onClose }) => {
  const { sheetBase } = useSystemDetailSheetBase(systemDetailId)
  const sheetConfig: SystemDetailSheetConfig = { ...sheetBase, entityId: systemDetailId, isCreateMode: false, basePath: '/registry/system-details' }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewSystemDetailSheet
