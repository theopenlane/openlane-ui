'use client'
import React, { useContext, useEffect, useState } from 'react'
import { PoliciesTable } from './table/policies-table'
import PoliciesDashboard from './policies-dashboard/policies-dashboard'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { SlidersHorizontal, SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import Link from 'next/link'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { Checkbox } from '@repo/ui/checkbox'
import { isStringArray, loadFilters, saveFilters } from '@/components/shared/table-filter/filter-storage'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { PolicySuggestedActions } from './policies-suggested-actions'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import TabSwitcher from '@/components/shared/tab-switcher/tab-switcher.tsx'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys.ts'
import { useInternalPoliciesCount } from '@/lib/graphql-hooks/policy.ts'

type TPoliciesPageProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
}

const PoliciesPage: React.FC<TPoliciesPageProps> = ({ active, setActive }) => {
  const { data: permission } = useOrganizationRoles()
  const { groupOptions } = useGroupSelect()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { isLoading: fetching, totalCount } = useInternalPoliciesCount({
    page: 1,
    pageSize: 1,
    query: { first: 1 },
  })

  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  useEffect(() => {
    const saved = loadFilters(TableFilterKeysEnum.POLICY)
    const validated = isStringArray(saved?.approverIDIn) ? saved?.approverIDIn : []
    setSelectedGroups(validated)

    const handleUpdate = (e: CustomEvent) => {
      setSelectedGroups((e.detail?.approverIDIn as string[]) || [])
    }

    window.addEventListener(`filters-updated:${TableFilterKeysEnum.POLICY}`, handleUpdate as EventListener)

    return () => {
      window.removeEventListener(`filters-updated:${TableFilterKeysEnum.POLICY}`, handleUpdate as EventListener)
    }
  }, [])

  const handleGroupToggle = (value: string) => {
    const existingFilters = loadFilters(TableFilterKeysEnum.POLICY) || {}
    const validated = isStringArray(existingFilters?.approverIDIn) ? existingFilters?.approverIDIn : []
    const newGroups = validated.includes(value) ? validated.filter((v) => v !== value) : [...validated, value]

    saveFilters(TableFilterKeysEnum.POLICY, {
      ...existingFilters,
      approverIDIn: newGroups,
    })
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Policies', href: '/policies' },
    ])
  }, [setCrumbs])

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <h1 className="text-3xl tracking-[-0.056rem] text-header">Internal Policies</h1>
          <TabSwitcher active={active} setActive={setActive} storageKey={TabSwitcherStorageKeys.POLICY} />
        </div>

        {active === 'dashboard' && (
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <PolicySuggestedActions />
            {totalCount > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" icon={<SlidersHorizontal />} iconPosition="left">
                    <span className="text-muted-foreground">Filter by:</span>
                    <span>Approver</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                  {groupOptions?.length ? (
                    groupOptions.map((group) => (
                      <DropdownMenuItem
                        key={group.value}
                        className="flex items-center gap-2"
                        onSelect={(e) => {
                          e.preventDefault()
                          handleGroupToggle(group.value)
                        }}
                      >
                        <Checkbox checked={selectedGroups?.includes(group.value)} />
                        <span>{group.label}</span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No groups available</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && totalCount > 0 && (
              <Link href="/policies/create">
                <Button className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
                  Create
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {active === 'dashboard' ? <PoliciesDashboard setActive={setActive} fetching={fetching} totalCount={totalCount} /> : <PoliciesTable />}
    </div>
  )
}

export default PoliciesPage
