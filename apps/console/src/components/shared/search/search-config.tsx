import { RoutePage } from '@/types'
import { SearchQuery } from '@repo/codegen/src/schema'
import { CircleGaugeIcon, UsersRoundIcon, ShieldCheck, AlertTriangle, Fingerprint, ListChecks, Settings2, ScrollText, Workflow, NotebookPen, FileBadge2 } from 'lucide-react'

export const searchTypeIcons: Record<string, React.ElementType> = {
  Home: CircleGaugeIcon,
  Tasks: ListChecks,
  Programs: ShieldCheck,
  Risks: AlertTriangle,
  Controls: Settings2,
  Evidence: Fingerprint,
  Policies: ScrollText,
  Procedures: Workflow,
  Questionnaires: NotebookPen,
  Standards: FileBadge2,
  Groups: UsersRoundIcon,
  Subcontrols: Settings2,
  ControlObjectives: Settings2,
}

export const generateSelectOptions = (data: SearchQuery | undefined, pages: RoutePage[] = []): { label: string; value: string }[] => {
  const search = data?.search ?? {}

  const counts: Record<string, number> = {
    Pages: pages.length,
    Organizations: search.organizations?.totalCount ?? 0,
    Programs: search.programs?.totalCount ?? 0,
    Groups: search.groups?.totalCount ?? 0,
    Tasks: search.tasks?.totalCount ?? 0,
    Controls: search.controls?.totalCount ?? 0,
    Subcontrols: search.subcontrols?.totalCount ?? 0,
    Risks: search.risks?.totalCount ?? 0,
    Policies: search.internalPolicies?.totalCount ?? 0,
    Procedures: search.procedures?.totalCount ?? 0,
  }

  const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0)

  return [
    { label: `All (${allCount})`, value: 'All' },
    ...Object.entries(counts).map(([key, count]) => ({
      label: `${key} (${count})`,
      value: key,
    })),
  ]
}

export const getSearchResultCount = (selectedType: string, data: SearchQuery | undefined, pages: RoutePage[] = []): number => {
  if (selectedType === 'Pages') return pages.length
  if (!data?.search) return 0

  const search = data.search

  const typeToCountMap: Record<string, number> = {
    Organizations: search.organizations?.totalCount ?? 0,
    Programs: search.programs?.totalCount ?? 0,
    Groups: search.groups?.totalCount ?? 0,
    Tasks: search.tasks?.totalCount ?? 0,
    Controls: search.controls?.totalCount ?? 0,
    Subcontrols: search.subcontrols?.totalCount ?? 0,
    Risks: search.risks?.totalCount ?? 0,
    Policies: search.internalPolicies?.totalCount ?? 0,
    Procedures: search.procedures?.totalCount ?? 0,
  }

  if (selectedType === 'All') {
    return pages.length + Object.values(typeToCountMap).reduce((sum, count) => sum + count, 0)
  }

  return typeToCountMap[selectedType] ?? 0
}
