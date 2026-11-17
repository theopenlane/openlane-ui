import { type QueryKey, useQuery } from '@tanstack/react-query'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { useObjectTypeAccess } from '@/lib/subscription-plan/hooks/use-module-access'

type TModuleGatedQueryArgs<TData> = {
  objectType: ObjectTypes
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  enabled?: boolean
}

export const useModuleGatedQuery = <TData>({ objectType, queryKey, queryFn, enabled = true }: TModuleGatedQueryArgs<TData>) => {
  const { hasAccess, isLoading: isAccessLoading } = useObjectTypeAccess(objectType)
  const isEnabled = enabled && hasAccess
  const queryResult = useQuery({ queryKey, queryFn, enabled: isEnabled })
  const hasFreshData = isEnabled && !queryResult.isPlaceholderData

  return {
    data: hasFreshData ? queryResult.data : undefined,
    isLoading: enabled && (isAccessLoading || (hasAccess && (queryResult.isPending || queryResult.isPlaceholderData))),
  }
}
