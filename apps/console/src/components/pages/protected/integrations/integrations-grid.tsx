'use client'

import React, { useEffect, useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'

import { type AvailableIntegrationNode, type IntegrationNode, type IntegrationProvider, type IntegrationStatusFilter } from '@/lib/integrations/types'
import { getInstalledIntegrationConfig } from '@/lib/integrations/utils'
import AvailableIntegrationCard from './available-integration-card'
import InstalledIntegrationCard from './installed-integration-card'
import { INFO_EMAIL } from '@/constants'
import { OTHER_TAG_SECTION_META, TAG_SECTIONS, type TagSectionMeta } from './integration-tag-pill'

type IntegrationsGridProps = {
  installedIntegrations: IntegrationNode[]
  availableIntegrations: AvailableIntegrationNode[]
  statusFilter: IntegrationStatusFilter
  providers: IntegrationProvider[]
  searchQuery: string
  selectedTags: string[]
  canManage: boolean
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
    <div className="text-center py-16 border rounded-lg max-w-screen-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
)

export function IntegrationsGrid({ installedIntegrations, availableIntegrations, statusFilter, providers, searchQuery, selectedTags, canManage }: IntegrationsGridProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredAvailableIntegrations = availableIntegrations.filter((integration) => {
    if (statusFilter === 'Installed') {
      return false
    }

    if (statusFilter === 'Coming Soon' && integration.provider.active) {
      return false
    }

    if (statusFilter === 'Not Installed' && integration.installedCount > 0) {
      return false
    }

    if (selectedTags.length > 0 && !selectedTags.some((tag) => integration.tags.includes(tag))) {
      return false
    }

    if (normalizedQuery === '') {
      return true
    }

    return matchesSearch(
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
  })

  const filteredInstalledIntegrations = installedIntegrations.filter((integration) => {
    if (statusFilter !== 'Installed') {
      return false
    }

    const integrationConfig = getInstalledIntegrationConfig(integration, providers)
    const provider = integrationConfig?.provider
    const tags = provider?.tags?.length ? provider.tags : (integration.tags ?? [])

    if (selectedTags.length > 0 && !selectedTags.some((tag) => tags.includes(tag))) {
      return false
    }

    if (normalizedQuery === '') {
      return true
    }

    return matchesSearch(
      [integration.name, integration.kind, provider?.id, provider?.slug, provider?.displayName, provider?.family, provider?.description || integration.description, ...tags],
      normalizedQuery,
    )
  })

  const hasActiveFilter = normalizedQuery || selectedTags.length > 0

  if (statusFilter === 'Installed' && filteredInstalledIntegrations.length === 0) {
    return <EmptyState message={hasActiveFilter ? 'No installed integrations match your search.' : 'No integrations installed.'} />
  }

  if (statusFilter !== 'Installed' && filteredAvailableIntegrations.length === 0 && hasActiveFilter) {
    return <EmptyState message="No integrations match your search." />
  }

  if (statusFilter === 'Coming Soon' && filteredAvailableIntegrations.length === 0) {
    return <EmptyState message="No coming soon integrations." />
  }

  if (statusFilter === 'Not Installed' && filteredAvailableIntegrations.length === 0) {
    return <EmptyState message="No available integrations to install." />
  }

  if (statusFilter === 'Installed') {
    return (
      <div className="grid gap-4 lg:grid-cols-2 mt-5">
        {filteredInstalledIntegrations.map((integration) => (
          <InstalledIntegrationCard key={integration.id} integration={integration} providers={providers} canManage={canManage} linkToDetail />
        ))}
      </div>
    )
  }

  const grouped = statusFilter === 'All' || statusFilter === 'Not Installed'

  return (
    <div className="mt-5">
      {grouped ? (
        <div className="flex flex-col gap-8">
          {groupByTagSection(filteredAvailableIntegrations, selectedTags).map((section) => (
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
      {statusFilter === 'All' && (
        <>
          <Separator className="my-6" />
          <Card className="flex items-center justify-between p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary">
            <div>
              <h3 className="text-sm font-medium">Missing an Integration?</h3>
              <p className="text-sm text-muted-foreground">Reach out and we can get you setup.</p>
            </div>
            <a href={INFO_EMAIL}>
              <Button variant="secondary" className="text-brand">
                Request
              </Button>
            </a>
          </Card>
        </>
      )}
    </div>
  )
}

// Number of cards shown before a section is collapsed
const COLLAPSED_SECTION_SIZE = 3

type IntegrationTagSectionProps = {
  title: string
  description?: string
  integrations: AvailableIntegrationNode[]
  canManage: boolean
  forceExpanded?: boolean
}

function IntegrationTagSection({ title, description, integrations, canManage, forceExpanded = false }: IntegrationTagSectionProps) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!forceExpanded) {
      setExpanded(false)
    }
  }, [forceExpanded])

  const isExpanded = forceExpanded || expanded
  const sortedIntegrations = [...integrations].sort(compareIntegrationsForDisplay)
  const hasMore = sortedIntegrations.length > COLLAPSED_SECTION_SIZE
  const visibleIntegrations = isExpanded ? sortedIntegrations : sortedIntegrations.slice(0, COLLAPSED_SECTION_SIZE)

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
            <Button type="button" variant="transparent" className="text-sm text-brand" onClick={() => setExpanded((prev) => !prev)}>
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

function matchesSearch(fields: Array<string | null | undefined>, query: string): boolean {
  return fields.filter(Boolean).join(' ').toLowerCase().includes(query)
}

// Installed integrations sort first, Coming Soon integrations always sort last, with primary-directory-capable
// providers surfacing within their tier so they aren't hidden behind "See all"
function integrationStatusPriority(integration: AvailableIntegrationNode): number {
  if (!integration.provider.active) {
    return 2
  }
  return integration.installedCount > 0 ? 0 : 1
}

function compareIntegrationsForDisplay(a: AvailableIntegrationNode, b: AvailableIntegrationNode): number {
  const priorityDiff = integrationStatusPriority(a) - integrationStatusPriority(b)
  if (priorityDiff !== 0) {
    return priorityDiff
  }
  return Number(b.supportsPrimaryDirectory) - Number(a.supportsPrimaryDirectory)
}

function groupByTagSection(integrations: AvailableIntegrationNode[], selectedTags: string[]): { title: string; description?: string; integrations: AvailableIntegrationNode[] }[] {
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

  return orderedSections.map((section) => ({ ...section, integrations: buckets.get(section) ?? [] })).filter((section) => section.integrations.length > 0)
}
