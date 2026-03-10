import { useEffect, useRef } from 'react'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

type ExtractFn<TData> = (data: TData) => TObjectAssociationMap

export function useInitialAssociations<TData>(data: TData | undefined, extractFn: ExtractFn<TData>, id: string | null) {
  const initialAssociationsRef = useRef<TObjectAssociationMap>({})
  const hasSetInitialAssociationsRef = useRef(false)

  useEffect(() => {
    if (data && !hasSetInitialAssociationsRef.current) {
      initialAssociationsRef.current = extractFn(data)
      hasSetInitialAssociationsRef.current = true
    }
  }, [data, extractFn])

  useEffect(() => {
    hasSetInitialAssociationsRef.current = false
    initialAssociationsRef.current = {}
  }, [id])

  return initialAssociationsRef
}
