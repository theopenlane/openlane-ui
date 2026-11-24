import { type ControlControlStatus, type SubcontrolControlStatus } from '@repo/codegen/src/schema'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type ControlImplementationLinkedControls } from '@/lib/graphql-hooks/control-implementation'
import { CUSTOM_STANDARD_FILTER_VALUE } from '@/components/shared/table-filter/custom-standard-filter'
import { compareNatural } from '@/lib/sort'
import { getControlImplementationTitle } from '@/utils/control-implementation'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

export type TOtherImplementations = {
  totalCount: number
  items: { id: string; title: string }[]
}

export type TLinkedControlRow = {
  id: string
  refCode: string
  title?: string | null
  status?: ControlControlStatus | SubcontrolControlStatus | null
  href?: string
  isSubcontrol: boolean
  others: TOtherImplementations
}

export type TFrameworkGroup = {
  framework: string
  rows: TLinkedControlRow[]
}

type TLinkedControlNode = NonNullable<NonNullable<NonNullable<ControlImplementationLinkedControls['controls']['edges']>[number]>['node']>
type TImplementationsConnection = TLinkedControlNode['controlImplementations']

type TControlEntry = {
  framework: string
  row: TLinkedControlRow
  subcontrols: TLinkedControlRow[]
}

const NO_OTHERS: TOtherImplementations = { totalCount: 0, items: [] }

const toOthers = (connection: TImplementationsConnection): TOtherImplementations => ({
  totalCount: connection.totalCount,
  items: getNodes(connection).map((node) => ({ id: node.id, title: getControlImplementationTitle(node) })),
})

export const buildFrameworkGroups = (implementation: Pick<ControlImplementationLinkedControls, 'controls' | 'subcontrols'>): TFrameworkGroup[] => {
  const entries = new Map<string, TControlEntry>()

  getNodes(implementation.controls).forEach(({ id, refCode, title, status, referenceFramework, controlImplementations }) => {
    entries.set(id, {
      framework: referenceFramework ?? '',
      row: { id, refCode, title, status, href: getHrefForObjectType('controls', { id }), isSubcontrol: false, others: toOthers(controlImplementations) },
      subcontrols: [],
    })
  })

  getNodes(implementation.subcontrols).forEach(({ id, refCode, title, status, control, controlImplementations }) => {
    const entry = entries.get(control.id) ?? {
      framework: control.referenceFramework ?? '',
      row: { id: control.id, refCode: control.refCode, title: control.title, isSubcontrol: false, others: NO_OTHERS },
      subcontrols: [],
    }
    entry.subcontrols.push({
      id,
      refCode,
      title,
      status,
      href: getHrefForObjectType('subcontrols', { id, controlId: control.id }),
      isSubcontrol: true,
      others: toOthers(controlImplementations),
    })
    entries.set(control.id, entry)
  })

  const groups = new Map<string, TLinkedControlRow[]>()
  ;[...entries.values()]
    .sort((a, b) => compareNatural(a.framework || CUSTOM_STANDARD_FILTER_VALUE, b.framework || CUSTOM_STANDARD_FILTER_VALUE) || compareNatural(a.row.refCode, b.row.refCode))
    .forEach(({ framework, row, subcontrols }) => groups.set(framework, [...(groups.get(framework) ?? []), row, ...subcontrols]))

  return [...groups].map(([framework, rows]) => ({ framework, rows }))
}

export const getLinkedControlCounts = ({ controls, subcontrols }: Pick<ControlImplementationLinkedControls, 'controls' | 'subcontrols'>): { loaded: number; total: number } => ({
  loaded: getNodes(controls).length + getNodes(subcontrols).length,
  total: controls.totalCount + subcontrols.totalCount,
})

export const hasUnloadedLinkedControls = (implementation: Pick<ControlImplementationLinkedControls, 'controls' | 'subcontrols'>): boolean => {
  const { loaded, total } = getLinkedControlCounts(implementation)
  return loaded < total
}

export const hasOtherImplementations = (groups: TFrameworkGroup[]): boolean => groups.some(({ rows }) => rows.some(({ others }) => others.totalCount > 0))
