import React, { useEffect, useMemo, useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'

import { type AvailableIntegrationNode, type IntegrationStatusFilter } from '@/lib/integrations/types'
import { matchesIntegrationSearch } from '@/lib/integrations/utils'
import AvailableIntegrationCard from './available-integration-card'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import BrowseIntegrationsFilters from './browse-integrations-filters'
import { INFO_EMAIL } from '@/constants'
import { OTHER_TAG_SECTION_META, TAG_SECTIONS, type TagSectionMeta } from './integration-tag-pill'

const COLLAPSED_SECTION_SIZE = 3

const EMPTY_STATE_DESCRIPTIONS: Record<IntegrationStatusFilter, string> = {
  All: 'There are no integrations available for your organization yet.',
  'Coming Soon': 'Nothing is queued up right now. Everything we offer is already available to install.',
  'Not Installed': 'You have installed every available integration.',
}

type BrowseIntegrationsGridProps = {
  availableIntegrations: AvailableIntegrationNode[]
  statusFilter: IntegrationStatusFilter
  setStatusFilter: (status: IntegrationStatusFilter) => void
  searchQuery: string
  allTags: string[]
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
  canManage: boolean
}

export const BrowseIntegrationsGrid = ({ availableIntegrations, statusFilter, setStatusFilter, searchQuery, allTags, selectedTags, setSelectedTags, canManage }: BrowseIntegrationsGridProps) => {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const searchAndTagMatches = useMemo(
    () =>
      availableIntegrations.filter((integration) => {
        if (selectedTags.length > 0 && !selectedTags.some((tag) => integration.tags.includes(tag))) {
          return false
        }

        if (normalizedQuery === '') {
          return true
        }

        return matchesIntegrationSearch(
          [
            integration.name,
            integration.description,
            integration.provider.id,
            integration.provider.slug,
            integration.provider.family,
            integration.provider.displayName,
            integration.provider.category,
            ...(integration.tags ?? []),
          ],
          normalizedQuery,
        )
      }),
    [availableIntegrations, selectedTags, normalizedQuery],
  )

  const statusCounts = useMemo(
    () => ({
      All: searchAndTagMatches.length,
      'Coming Soon': searchAndTagMatches.filter((integration) => !integration.provider.active).length,
      'Not Installed': searchAndTagMatches.filter((integration) => integration.installedCount === 0).length,
    }),
    [searchAndTagMatches],
  )

  const filteredAvailableIntegrations = useMemo(
    () =>
      searchAndTagMatches.filter((integration) => {
        if (statusFilter === 'Coming Soon') {
          return !integration.provider.active
        }

        if (statusFilter === 'Not Installed') {
          return integration.installedCount === 0
        }

        return true
      }),
    [searchAndTagMatches, statusFilter],
  )

  const grouped = statusFilter === 'All' || statusFilter === 'Not Installed'

  const sections = useMemo(() => (grouped ? groupByTagSection(filteredAvailableIntegrations, selectedTags) : []), [grouped, filteredAvailableIntegrations, selectedTags])

  const activeFilterHints = [normalizedQuery !== '' && 'searching for something else', selectedTags.length > 0 && 'clearing the selected tags'].filter(
    (hint): hint is string => typeof hint === 'string',
  )

  return (
    <div className="flex flex-col gap-5">
      <BrowseIntegrationsFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusCounts={statusCounts}
        allTags={allTags}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
      {filteredAvailableIntegrations.length === 0 ? (
        activeFilterHints.length > 0 ? (
          <EmptyTabState title="No integrations match your filters" description={`Try ${activeFilterHints.join(' or ')}.`} />
        ) : (
          <EmptyTabState title="No integrations to show" description={EMPTY_STATE_DESCRIPTIONS[statusFilter]} />
        )
      ) : grouped ? (
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <IntegrationTagSection key={section.title} {...section} canManage={canManage} forceExpanded={selectedTags.length > 0} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAvailableIntegrations.map((integration) => (
            <AvailableIntegrationCard key={integration.id} integration={integration} canManage={canManage} />
          ))}
        </div>
      )}
      {statusFilter === 'All' && activeFilterHints.length === 0 && (
        <>
          <Separator className="my-1" />
          <Card className="flex items-center justify-between p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary">
            <div>
              <h3 className="text-sm font-medium">Missing an Integration?</h3>
              <p className="text-sm text-muted-foreground">Reach out and we can get you setup.</p>
            </div>
            <a href={INFO_EMAIL}>
              <Button variant="secondary">Request</Button>
            </a>
          </Card>
        </>
      )}
    </div>
  )
}

type IntegrationTagSectionProps = {
  title: string
  description?: string
  integrations: AvailableIntegrationNode[]
  canManage: boolean
  forceExpanded?: boolean
}

const IntegrationTagSection = ({ title, description, integrations, canManage, forceExpanded = false }: IntegrationTagSectionProps) => {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!forceExpanded) {
      setExpanded(false)
    }
  }, [forceExpanded])

  const isExpanded = forceExpanded || expanded
  const hasMore = integrations.length > COLLAPSED_SECTION_SIZE
  const visibleIntegrations = isExpanded ? integrations : integrations.slice(0, COLLAPSED_SECTION_SIZE)

  return (
    <section>
      <div className="mb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
            <Badge variant="outline" className="text-[10px]">
              {integrations.length}
            </Badge>
          </div>
          {hasMore && !forceExpanded ? (
            <Button type="button" variant="transparent" className="text-sm text-primary" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? 'Show less' : 'See all'}
            </Button>
          ) : null}
        </div>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleIntegrations.map((integration) => (
          <AvailableIntegrationCard key={integration.id} integration={integration} canManage={canManage} />
        ))}
      </div>
    </section>
  )
}

const integrationStatusPriority = (integration: AvailableIntegrationNode): number => {
  if (!integration.provider.active) {
    return 2
  }
  return integration.installedCount > 0 ? 0 : 1
}

const compareIntegrationsForDisplay = (a: AvailableIntegrationNode, b: AvailableIntegrationNode): number => {
  const priorityDiff = integrationStatusPriority(a) - integrationStatusPriority(b)
  if (priorityDiff !== 0) {
    return priorityDiff
  }
  return Number(b.supportsPrimaryDirectory) - Number(a.supportsPrimaryDirectory)
}

const groupByTagSection = (integrations: AvailableIntegrationNode[], selectedTags: string[]): { title: string; description?: string; integrations: AvailableIntegrationNode[] }[] => {
  const eligibleSections = selectedTags.length > 0 ? TAG_SECTIONS.filter((section) => section.tags.some((tag) => selectedTags.includes(tag))) : TAG_SECTIONS

  const buckets = new Map<TagSectionMeta, AvailableIntegrationNode[]>()
  const matchedAny = new Set<AvailableIntegrationNode>()

  for (const section of eligibleSections) {
    const matches = integrations.filter((integration) => section.tags.some((tag) => integration.tags.includes(tag)))
    if (matches.length > 0) {
      buckets.set(section, matches)
      matches.forEach((integration) => matchedAny.add(integration))
    }
  }

  const unmatched = integrations.filter((integration) => !matchedAny.has(integration))
  if (unmatched.length > 0) {
    buckets.set(OTHER_TAG_SECTION_META, unmatched)
  }

  const orderedSections = [...eligibleSections, OTHER_TAG_SECTION_META]

  return orderedSections.map((section) => ({ ...section, integrations: [...(buckets.get(section) ?? [])].sort(compareIntegrationsForDisplay) })).filter((section) => section.integrations.length > 0)
}
