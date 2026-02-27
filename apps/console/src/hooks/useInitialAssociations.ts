import { useEffect, useRef } from 'react'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

type ExtractFn<TData> = (data: TData) => TObjectAssociationMap

export function useInitialAssociations<TData>(data: TData | undefined, extractFn: ExtractFn<TData>, id: string | null) {
  const initialAssociationsRef = useRef<TObjectAssociationMap>({})
  const hasSetInitialAssociations = useRef(false)

  useEffect(() => {
    if (data && !hasSetInitialAssociations.current) {
      initialAssociationsRef.current = extractFn(data)
      hasSetInitialAssociations.current = true
    }
  }, [data, extractFn])

  useEffect(() => {
    hasSetInitialAssociations.current = false
  }, [id])

  return initialAssociationsRef
}
