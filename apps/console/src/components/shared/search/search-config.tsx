import type { RoutePage } from '@/types'
import type { SearchContextGroup } from '@/lib/graphql-hooks/search'
import { toHumanLabel } from '@/utils/strings'
import { CircleGaugeIcon, UsersRoundIcon, ShieldCheck, AlertTriangle, Fingerprint, ListChecks, Settings2, ScrollText, Workflow, NotebookPen, FileBadge2 } from 'lucide-react'

export const searchTypeIcons: Record<string, React.ElementType> = {
  Pages: CircleGaugeIcon,
  Task: ListChecks,
  Program: ShieldCheck,
  Risk: AlertTriangle,
  Control: Settings2,
  Evidence: Fingerprint,
  InternalPolicy: ScrollText,
  Procedure: Workflow,
  Questionnaires: NotebookPen,
  Standards: FileBadge2,
  Standard: FileBadge2,
  Template: NotebookPen,
  Group: UsersRoundIcon,
  Subcontrol: Settings2,
  ControlObjectives: Settings2,
  Organization: UsersRoundIcon,
}

export const getEntityTypeLabel = (entityType: string) => toHumanLabel(entityType)

export const generateSelectOptions = (contextGroups: SearchContextGroup[] = [], pages: RoutePage[] = []): { label: string; value: string }[] => {
  const allCount = pages.length + contextGroups.reduce((sum, group) => sum + group.results.length, 0)
  return [
    { label: `All (${allCount})`, value: 'All' },
    { label: `Pages (${pages.length})`, value: 'Pages' },
    ...contextGroups.map(({ entityType, results }) => ({
      label: `${getEntityTypeLabel(entityType)} (${results.length})`,
      value: entityType,
    })),
  ]
}

export const getSearchResultCount = (selectedType: string, contextGroups: SearchContextGroup[] = [], pages: RoutePage[] = []): number => {
  if (selectedType === 'Pages') return pages.length

  if (selectedType === 'All') {
    return pages.length + contextGroups.reduce((sum, group) => sum + group.results.length, 0)
  }

  const matchingGroup = contextGroups.find((group) => group.entityType === selectedType)
  return matchingGroup?.results.length ?? 0
}
