import { createOrgPersistedStore, parseStringUnion } from '@/lib/storage/org-persisted-store'
import { isOneOf } from '@/utils/type-guards'

const LINKED_CONTROLS_VIEWS = ['map', 'list'] as const

type TLinkedControlsView = (typeof LINKED_CONTROLS_VIEWS)[number]

export const isLinkedControlsView = isOneOf<TLinkedControlsView>(LINKED_CONTROLS_VIEWS)

export const linkedControlsViewStore = createOrgPersistedStore<TLinkedControlsView>(
  'control-implementation-linked-controls-view',
  (raw) => parseStringUnion(raw, isLinkedControlsView),
  () => 'map',
)
