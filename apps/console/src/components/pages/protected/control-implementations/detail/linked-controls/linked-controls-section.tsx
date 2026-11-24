'use client'

import React, { useMemo, useRef, useState } from 'react'
import { aiEnabled } from '@repo/dally/ai'
import { List, Network } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { LINKABLE_CONTROL_TYPES } from '@/components/shared/object-association/association-configs'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useControlImplementationLinkedControls } from '@/lib/graphql-hooks/control-implementation'
import { MAX_SUGGESTION_CANDIDATES } from '@/lib/control-suggestions/schema'
import { htmlToText } from '@/lib/html/html-to-text'
import { useSuggestControls } from '@/lib/query-hooks/use-suggest-controls'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { SetControlImplementationAssociationDialog } from '../../set-control-implementation-association-dialog'
import { buildFrameworkGroups, getLinkedControlCounts, hasOtherImplementations } from './linked-control-groups'
import { LinkedControlsEmptyState } from './linked-controls-empty-state'
import { LinkedControlsList } from './linked-controls-list'
import { LinkedControlsMap } from './linked-controls-map'
import { SuggestedControls } from './suggested-controls'
import { isLinkedControlsView, linkedControlsViewStore } from './linked-controls-view-store'

type TLinkedControlsSectionProps = {
  controlImplementationId: string
  details?: string | null
  canEdit: boolean
}

const LinkedControlsSection: React.FC<TLinkedControlsSectionProps> = ({ controlImplementationId, details, canEdit }) => {
  const { currentOrgId } = useOrganization()
  const { value: view, setValue: setView } = useOrgPersistedState(linkedControlsViewStore, currentOrgId)
  const { data, isPending, error } = useControlImplementationLinkedControls(controlImplementationId)
  useQueryErrorNotification({ error, description: 'Failed to load linked controls' })

  const implementation = data?.controlImplementation
  const groups = useMemo(() => (implementation ? buildFrameworkGroups(implementation) : []), [implementation])
  const linkedIds = useMemo(() => new Set(groups.flatMap(({ rows }) => rows.filter(({ href }) => href).map(({ id }) => id))), [groups])
  const { errorNotification, infoNotification } = useNotification()
  const isSuggestingRef = useRef(false)
  const detailsText = useMemo(() => htmlToText(details ?? '').trim(), [details])
  const { mutateAsync: suggestControls, data: suggested, variables: suggestedFrom, isPending: isSuggesting, reset: dismissSuggestions } = useSuggestControls()
  const suggestions = suggestedFrom === detailsText ? (suggested?.controls ?? []).filter(({ id }) => !linkedIds.has(id)) : []
  const canSuggest = aiEnabled && !!detailsText

  const handleSuggest = async () => {
    if (isSuggestingRef.current) return
    isSuggestingRef.current = true
    try {
      const { controls, isPartial } = await suggestControls(detailsText)
      if (controls.length === 0) {
        infoNotification({
          title: 'No matching controls',
          description: isPartial ? `None of the first ${MAX_SUGGESTION_CANDIDATES} controls clearly match these details.` : 'No controls in your organization clearly match these details.',
        })
      }
    } catch (error) {
      errorNotification({ title: 'Failed to suggest controls', description: parseErrorMessage(error) })
    } finally {
      isSuggestingRef.current = false
    }
  }

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const showOthers = hasOtherImplementations(groups)

  if (isPending) {
    return <Skeleton height={160} className="w-full rounded-lg" />
  }

  if (!implementation) {
    return <EmptyTabState title="Controls unavailable" description="The linked controls could not be loaded. Please try again later." />
  }

  const { loaded, total } = getLinkedControlCounts(implementation)

  return (
    <>
      {groups.length === 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Controls</h2>
          <LinkedControlsEmptyState onLinkControls={() => setIsLinkDialogOpen(true)} canEdit={canEdit} onSuggest={canSuggest ? handleSuggest : undefined} isSuggesting={isSuggesting} />
        </section>
      ) : (
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
      )}
      <div className="mt-4" aria-live="polite">
        {canEdit && suggestions.length > 0 && <SuggestedControls controlImplementationId={controlImplementationId} suggestions={suggestions} onDismiss={dismissSuggestions} />}
      </div>
      {canEdit && (
        <SetControlImplementationAssociationDialog
          controlImplementationId={controlImplementationId}
          open={isLinkDialogOpen}
          onOpenChange={setIsLinkDialogOpen}
          defaultSelectedObject={ObjectTypeObjects.CONTROL}
          allowedObjectTypes={LINKABLE_CONTROL_TYPES}
        />
      )}
    </>
  )
}

export default LinkedControlsSection
