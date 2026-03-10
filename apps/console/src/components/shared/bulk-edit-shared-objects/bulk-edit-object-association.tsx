'use client'

import { useCallback, useRef } from 'react'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

type Props = {
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  onChange: (updatedMap: Record<string, string[]>) => void
}

export const BulkEditObjectAssociation: React.FC<Props> = ({ allowedObjectTypes, onChange }) => {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const stableOnIdChange = useCallback((updatedMap: TObjectAssociationMap) => {
    onChangeRef.current(updatedMap as Record<string, string[]>)
  }, [])

  return <ObjectAssociation allowedObjectTypes={allowedObjectTypes} onIdChange={stableOnIdChange} />
}
