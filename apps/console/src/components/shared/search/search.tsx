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

export const GlobalSearch = () => {
  const { popover } = searchStyles()
  const [open, setOpen] = useState(false) // Controls dropdown visibility
  const [query, setQuery] = useState('') // Tracks user input
  const [hasResults, setHasResults] = useState(false)
  const cmdInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
          <Input
            ref={inputRef}
            placeholder="Search..."
            icon={<SearchIcon size={16} />}
            value={query}
            onChange={(e) => {
              e.stopPropagation()
              e.preventDefault()

              setQuery(e.currentTarget.value)
            }}
            onKeyDown={relayInputKeyDownToCommand}
            className="!border-none !h-9"
            iconPosition="left"
          />
        </PopoverAnchor>
        <PopoverTrigger asChild>
          <div />
        </PopoverTrigger>
        <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className={popover()}>
          <Command>
            <div ref={cmdInputRef} className="hidden" /> {/* Hidden input to relay keydown events */}
            {hasResults && data ? renderSearchResults({ data, handleOrganizationSwitch, setQuery }) : renderNoResults()}
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

interface SearchProps {
  data: SearchQuery
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
}

const renderSearchResults = ({ data, handleOrganizationSwitch, setQuery }: SearchProps) => {
  if (!data?.search) return null

  const { search } = data

  return (
    <CommandList key="search-results" className="max-h-[600px] overflow-auto">
      {/* Organizations */}
      {!!search?.organizations?.edges?.length &&
        renderOrgGroupResults({
          searchType: 'Organization',
          node: search.organizations?.edges?.map((edge) => edge?.node!) ?? [],
          handleOrganizationSwitch,
          setQuery,
        })}

      {/* Programs */}
      {!!search.programs?.edges?.length &&
        renderGroupResults({
          searchType: 'Program',
          node: (search.programs.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Groups */}
      {!!search.groups?.edges?.length &&
        renderGroupResults({
          searchType: 'Group',
          node: (search.groups.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Tasks */}
      {!!search.tasks?.edges?.length &&
        renderGroupResults({
          searchType: 'Task',
          node: (search.tasks.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Control Objectives */}
      {!!search.controlObjectives?.edges?.length &&
        renderGroupResults({
          searchType: 'ControlObjective',
          node: (search.controlObjectives.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Controls */}
      {!!search.controls?.edges?.length &&
        renderGroupResults({
          searchType: 'Control',
          node: (search.controls.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Subcontrols */}
      {!!search.subcontrols?.edges?.length &&
        renderGroupResults({
          searchType: 'Subcontrol',
          node: (search.subcontrols.edges ?? []).map((edge) => edge?.node!) ?? [],
        })}

      {/* Risks */}
      {!!search.risks?.edges?.length &&
        renderGroupResults({
          searchType: 'Risk',
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
  const groupKey = `${searchType.toLowerCase()}s`
  return (
    <CommandGroup key={groupKey} heading={`${searchType}s`}>
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

  const groupKey = `${searchType.toLowerCase()}s`
  return (
    <CommandGroup key={groupKey} heading={`${searchType}s`}>
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

  return (
    <CommandItem className={item()} key={node.id} onSelect={() => (window.location.href = `/${nodeType}/${node.id}`)}>
      <Link href={`/${nodeType}/${node.id}`}>
        <div>{node.name || node.refCode || node.title || 'Unnamed'}</div>
      </Link>
    </CommandItem>
  )
}
