'use client'

import React, { useMemo } from 'react'
import { List, Network } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import Skeleton from '@/components/shared/skeleton/skeleton'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { useOrganization } from '@/hooks/useOrganization'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useControlImplementationLinkedControls } from '@/lib/graphql-hooks/control-implementation'
import { useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { buildFrameworkGroups, getLinkedControlCounts, hasOtherImplementations } from './linked-control-groups'
import { LinkedControlsList } from './linked-controls-list'
import { LinkedControlsMap } from './linked-controls-map'
import { isLinkedControlsView, linkedControlsViewStore } from './linked-controls-view-store'

type TLinkedControlsSectionProps = {
  controlImplementationId: string
}

const LinkedControlsSection: React.FC<TLinkedControlsSectionProps> = ({ controlImplementationId }) => {
  const { currentOrgId } = useOrganization()
  const { value: view, setValue: setView } = useOrgPersistedState(linkedControlsViewStore, currentOrgId)
  const { data, isPending, error } = useControlImplementationLinkedControls(controlImplementationId)
  useQueryErrorNotification({ error, description: 'Failed to load linked controls' })

  const implementation = data?.controlImplementation
  const groups = useMemo(() => (implementation ? buildFrameworkGroups(implementation) : []), [implementation])
  const showOthers = hasOtherImplementations(groups)

  if (isPending) {
    return <Skeleton height={160} className="w-full rounded-lg" />
  }

  if (!implementation) {
    return <EmptyTabState title="Controls unavailable" description="The linked controls could not be loaded. Please try again later." />
  }

  const { loaded, total } = getLinkedControlCounts(implementation)

  if (groups.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Controls</h2>
        <EmptyTabState description="No controls are linked to this implementation yet." />
      </section>
    )
  }

  return (
    <Tabs
      variant="solid"
      value={view}
      onValueChange={(next) => {
        if (isLinkedControlsView(next)) setView(next)
      }}
    >
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-semibold">Controls</h2>
          <TabsList className="w-fit">
            <TabsTrigger value="map">
              <span className="inline-flex items-center gap-1.5">
                <Network size={14} />
                Map
              </span>
            </TabsTrigger>
            <TabsTrigger value="list">
              <span className="inline-flex items-center gap-1.5">
                <List size={14} />
                List
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="map">
          <LinkedControlsMap groups={groups} showOthers={showOthers} />
        </TabsContent>
        <TabsContent value="list">
          <LinkedControlsList groups={groups} showOthers={showOthers} />
        </TabsContent>
        {loaded < total && (
          <p className="text-sm text-muted-foreground">
            Showing {loaded} of {total} linked controls.
          </p>
        )}
      </section>
    </Tabs>
  )
}

export default LinkedControlsSection
