import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { switchOrganization } from '@/lib/user'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { searchStyles } from './search.styles'

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Input } from '@repo/ui/input'

import { SearchIcon } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import { useSearch } from '@/lib/graphql-hooks/search'
import { SearchQuery } from '@repo/codegen/src/schema'
import { Avatar } from '../avatar/avatar'
import { useShortcutSuffix } from '@/components/shared/shortcut-suffix/shortcut-suffix.tsx'
import routeList from '@/route-list.json'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

export const GlobalSearch = () => {
  const { popover } = searchStyles()
  const [open, setOpen] = useState(false) // Controls dropdown visibility
  const [query, setQuery] = useState('') // Tracks user input
  const [hasResults, setHasResults] = useState(false)
  const cmdInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { fullSuffix } = useShortcutSuffix()

  const { data: sessionData, update: updateSession } = useSession()
  const { push } = useRouter()

  const debouncedQuery = useDebounce(query, 300)

  let { data, isFetching } = useSearch(debouncedQuery)

  // when the organization is selected, switch the organization and redirect to the dashboard
  const handleOrganizationSwitch = async (orgId?: string) => {
    if (orgId) {
      const response = await switchOrganization({
        target_organization_id: orgId,
      })

      if (sessionData && response) {
        await updateSession({
          ...response.session,
          user: {
            ...sessionData.user,
            accessToken: response.access_token,
            activeOrganizationId: orgId,
            refreshToken: response.refresh_token,
          },
        })
      }

      push('/dashboard')
    }
  }

  // add command to open the search bar
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // reset the data when the query is empty or too short
  useEffect(() => {
    if (query.length < 2) {
      data = undefined

      setOpen(false)
      setHasResults(false)
    }
  }, [query])

  // open the popover when the data is fetched
  useEffect(() => {
    if (isFetching) {
      setOpen(false)
    }

    if (data && data.search) {
      setOpen(true)
      setHasResults(Object.values(data.search).some((val) => val !== null))
    } else {
      setHasResults(false)
      setOpen(false)
    }
  }, [data, isFetching])

  /**
   * Pass all keydown events from the input to the `CommandInput` to provide navigation using up/down arrow keys etc.
   */
  const relayInputKeyDownToCommand = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const { key, code, bubbles } = e
    cmdInputRef.current?.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles }))

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
    }
  }

  return (
    <div className="relative w-72">
      <Popover key={'search-results'} open={open} onOpenChange={setOpen}>
        <PopoverAnchor>
          <div className="relative flex items-center">
            <Input
              ref={inputRef}
              placeholder="Search..."
              icon={<SearchIcon size={16} />}
              suffix={fullSuffix}
              value={query}
              onChange={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setQuery(e.currentTarget.value)
              }}
              onKeyDown={relayInputKeyDownToCommand}
              className="!border-none !h-9 pr-14"
              iconPosition="left"
            />
          </div>
        </PopoverAnchor>
        <PopoverTrigger asChild>
          <div />
        </PopoverTrigger>
        <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className={popover()}>
          <Command>
            <div ref={cmdInputRef} className="hidden" /> {/* Hidden input to relay keydown events */}
            {renderSearchResults({ data, handleOrganizationSwitch, setQuery, query, hasResults })}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// renderNoResults is a generic function to render no results found message if there are no search results
const renderNoResults = () => {
  return (
    <CommandList>
      <CommandEmpty>No results found</CommandEmpty>
    </CommandList>
  )
}

const renderRouteResults = (routes: { name: string; route: string }[]) => {
  const { item } = searchStyles()

  return (
    <CommandGroup key="routes" heading="Pages">
      {routes.map((route) => (
        <CommandItem className={item()} key={route.route} onSelect={() => (window.location.href = route.route)}>
          <Link href={route.route}>
            <div>{route.name}</div>
          </Link>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

interface SearchProps {
  data: SearchQuery | undefined
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
  query: string
  hasResults: boolean
}

const renderSearchResults = ({ data, handleOrganizationSwitch, setQuery, query, hasResults }: SearchProps) => {
  const routeMatches =
    query.length > 1
      ? routeList.filter((r) => {
          if (r?.hidden === true) {
            return false
          }

          const nameMatch = r.name?.toLowerCase().includes(query.toLowerCase())
          const keywordMatch = r.keywords?.some((kw: string) => kw.toLowerCase().includes(query.toLowerCase()))
          return nameMatch || keywordMatch
        })
      : []

  const noResults = !routeMatches.length && !hasResults

  if (noResults) {
    return renderNoResults()
  }

  if (!data?.search) return null

  const { search } = data

  return (
    <CommandList key="search-results" className="max-h-[600px] overflow-auto">
      {!!routeMatches.length && renderRouteResults(routeMatches)}
      {/* Organizations */}
      {!!search?.organizations?.edges?.length &&
        renderOrgGroupResults({
          searchType: 'Organizations',
          node: search.organizations?.edges?.map((edge) => edge?.node!) ?? [],
          handleOrganizationSwitch,
          setQuery,
        })}

      {/* Programs */}
      {!!search.programs?.edges?.length &&
        renderGroupResults({
          searchType: 'Programs',
          node: (search.programs.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Groups */}
      {!!search.groups?.edges?.length &&
        renderGroupResults({
          searchType: 'Groups',
          node: (search.groups.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Tasks */}
      {!!search.tasks?.edges?.length &&
        renderGroupResults({
          searchType: 'Tasks',
          node: (search.tasks.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Control Objectives */}
      {!!search.controlObjectives?.edges?.length &&
        renderGroupResults({
          searchType: 'ControlObjectives',
          node: (search.controlObjectives.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Controls */}
      {!!search.controls?.edges?.length &&
        renderGroupResults({
          searchType: 'Controls',
          node: (search.controls.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Subcontrols */}
      {!!search.subcontrols?.edges?.length &&
        renderGroupResults({
          searchType: 'Subcontrols',
          node: (search.subcontrols.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Risks */}
      {!!search.risks?.edges?.length &&
        renderGroupResults({
          searchType: 'Risks',
          node: (search.risks.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}
    </CommandList>
  )
}

interface SearchNodeProps {
  searchType: string
  node: any
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
}

// renderGroupResults is a generic function to render search results for any type of entity
const renderGroupResults = ({ searchType, node }: SearchNodeProps) => {
  const groupKey = `${searchType.toLowerCase()}`
  return (
    <CommandGroup key={groupKey} heading={`${searchType}`}>
      {node.map((searchNode: any) => renderSearchResultField({ node: searchNode, searchType }))}
    </CommandGroup>
  )
}

interface SearchGroupProps {
  node: any
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
}

// renderOrgGroupResults is specific for organizations which switches into the organization rather than redirecting to the page
const renderOrgGroupResults = ({ searchType, node, handleOrganizationSwitch, setQuery }: SearchNodeProps) => {
  if (handleOrganizationSwitch === undefined || setQuery === undefined) {
    return
  }

  const groupKey = `${searchType.toLowerCase()}`
  return (
    <CommandGroup key={groupKey} heading={`${searchType}`}>
      {node.map((searchNode: any) => renderOrgSearchResultField({ node: searchNode, handleOrganizationSwitch, setQuery, searchType }))}
    </CommandGroup>
  )
}

// renderOrgSearchResultField is specific for organizations which switches into the organization rather than redirecting to the page
const renderOrgSearchResultField = ({ node, handleOrganizationSwitch, setQuery }: SearchGroupProps) => {
  if (handleOrganizationSwitch === undefined || setQuery === undefined) {
    return
  }

  const { item, avatarRow } = searchStyles()

  return (
    <CommandItem
      className={item()}
      key={node.id}
      onSelect={() => {
        setQuery('')
        handleOrganizationSwitch(node.id)
      }}
    >
      <div>
        <div className={avatarRow()}>
          <Avatar entity={node} />
          {node.displayName}
        </div>
      </div>
    </CommandItem>
  )
}

// renderSearchResultField is a generic function to render search result for any type of entity
interface SearchGroupProps {
  node: any
  searchType: string
}

const renderSearchResultField = ({ node, searchType }: SearchGroupProps) => {
  const { item } = searchStyles()
  const nodeType = searchType.toLowerCase()
  const href = getHrefForObjectType(nodeType, node)

  return (
    <CommandItem className={item()} key={node.id}>
      {href ? (
        <Link href={href}>
          <div>{node.name || node.refCode || node.title || 'Unnamed'}</div>
        </Link>
      ) : (
        <div>{node.name || node.refCode || node.title || 'Unnamed'}</div>
      )}
    </CommandItem>
  )
}
