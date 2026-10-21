'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { type GetIntegrationsQuery } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { mergeSelectedResources, readSelectedResources } from '@/lib/integrations/flow'
import { resolveResourcePicker } from '@/lib/integrations/resource-pickers'
import { type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { fetchIntegrationPickerSession, useSaveIntegrationResourceSelection } from '@/lib/query-hooks/integrations'
import { pluralizeWithCount } from '@/utils/strings'

type TResourcePickerActivity = {
  integrationId: string
  action: 'pick' | 'remove'
}

let activeTask: Promise<void> | null = null
let activity: TResourcePickerActivity | null = null
const listeners = new Set<() => void>()

const setActivity = (next: TResourcePickerActivity | null) => {
  activity = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getActivity = () => activity

const runExclusive = (next: TResourcePickerActivity, task: () => Promise<void>): Promise<void> => {
  if (activeTask) {
    return activeTask
  }

  setActivity(next)
  activeTask = task().finally(() => {
    activeTask = null
    setActivity(null)
  })

  return activeTask
}

const latestIntegration = (queryClient: QueryClient, integration: IntegrationNode): IntegrationNode => {
  for (const [, data] of queryClient.getQueriesData<GetIntegrationsQuery>({ queryKey: ['integrations'] })) {
    const node = getNodes(data?.integrations).find((candidate) => candidate.id === integration.id)
    if (node) {
      return node
    }
  }

  return integration
}

const errorDescription = (error: unknown, fallback: string): string => (error instanceof Error && error.message ? error.message : fallback)

export const useResourcePicker = (provider: IntegrationProvider | undefined) => {
  const queryClient = useQueryClient()
  const { mutateAsync: saveSelection } = useSaveIntegrationResourceSelection()
  const { successNotification, errorNotification } = useNotification()
  const currentActivity = useSyncExternalStore(subscribe, getActivity, getActivity)
  const ownedTaskRef = useRef<Promise<void> | null>(null)

  const providerRef = useRef(provider)

  useEffect(() => {
    providerRef.current = provider
  }, [provider])

  useEffect(
    () => () => {
      if (ownedTaskRef.current && ownedTaskRef.current === activeTask) {
        resolveResourcePicker(providerRef.current)?.cancel()
      }
    },
    [],
  )

  const own = useCallback((task: Promise<void>): Promise<void> => {
    ownedTaskRef.current = task
    return task
  }, [])

  const chooseResources = useCallback(
    (integration: IntegrationNode): Promise<void> =>
      own(
        runExclusive({ integrationId: integration.id, action: 'pick' }, async () => {
          try {
            const picker = resolveResourcePicker(provider)
            if (!picker) {
              throw new UserFacingError(`Choosing documents is not available for ${provider?.displayName ?? 'this integration'}.`)
            }

            const [session] = await Promise.all([fetchIntegrationPickerSession(integration.id), picker.preload()])
            const picked = await picker.pick(session)
            if (picked.length === 0) {
              return
            }

            const current = readSelectedResources(latestIntegration(queryClient, integration))
            const currentIds = new Set(current.map((resource) => resource.id))
            const addedCount = picked.filter((resource) => !currentIds.has(resource.id)).length

            await saveSelection({ integrationId: integration.id, resources: mergeSelectedResources(current, picked) })
            successNotification({
              title: 'Documents selected',
              description: addedCount > 0 ? `${pluralizeWithCount(addedCount, 'document')} added.` : 'Those documents were already selected.',
            })
          } catch (error) {
            errorNotification({
              title: 'Could not choose documents',
              description: errorDescription(error, 'Unexpected error while choosing documents. Please try again later.'),
            })
          }
        }),
      ),
    [own, provider, queryClient, saveSelection, successNotification, errorNotification],
  )

  const removeResource = useCallback(
    (integration: IntegrationNode, resourceId: string): Promise<void> =>
      own(
        runExclusive({ integrationId: integration.id, action: 'remove' }, async () => {
          try {
            await saveSelection({
              integrationId: integration.id,
              resources: readSelectedResources(latestIntegration(queryClient, integration)).filter((resource) => resource.id !== resourceId),
            })
          } catch (error) {
            errorNotification({
              title: 'Failed to remove document',
              description: errorDescription(error, 'Unexpected error while removing the document. Please try again later.'),
            })
          }
        }),
      ),
    [own, queryClient, saveSelection, errorNotification],
  )

  const isPickingFor = useCallback((integrationId: string) => currentActivity?.action === 'pick' && currentActivity.integrationId === integrationId, [currentActivity])

  return { chooseResources, removeResource, isPickingFor, isBusy: currentActivity !== null }
}
