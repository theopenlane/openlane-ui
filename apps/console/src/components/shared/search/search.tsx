import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchQuery, SearchQuery } from '@repo/codegen/src/schema'
import { switchOrganization } from '@/lib/user'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { searchStyles } from './search.styles'

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Input } from '@repo/ui/input'

import { SearchIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'

export const GlobalSearch = () => {
  const { popover } = searchStyles()
  const [open, setOpen] = useState(false) // Controls dropdown visibility
  const [query, setQuery] = useState('') // Tracks user input
  const [hasResults, setHasResults] = useState(false)
  const cmdInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: sessionData, update: updateSession } = useSession()
  const { push } = useRouter()

  let [{ data, fetching }] = useSearchQuery({
    variables: { query: query },
    pause: query.length < 3, // do not fetch until the query is at least 3 characters long because it is rejected by the server
  })

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
    if (fetching) {
      setOpen(false)
    }

    if (data && data.search) {
      setOpen(true)
      setHasResults(data.search.totalCount > 0)
    } else {
      setHasResults(false)
      setOpen(false)
    }
  }, [data, fetching])

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
            icon={<SearchIcon size={17} />}
            value={query}
            onChange={(e) => {
              e.stopPropagation()
              e.preventDefault()

              setQuery(e.currentTarget.value)
            }}
            onKeyDown={relayInputKeyDownToCommand}
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
  return (
    <CommandList key="search-results" className="max-h-[600px]">
      {data?.search?.nodes?.map((node) => {
        // render the organization search results differently, and first
        switch (node?.__typename) {
          case 'OrganizationSearchResult':
            return renderOrgGroupResults({ searchType: 'Organization', node: node.organizations, handleOrganizationSwitch, setQuery })
          default:
            return null
        }
      })}
      {data?.search?.nodes?.map((node) => {
        switch (node?.__typename) {
          case 'ProgramSearchResult':
            return renderGroupResults({ searchType: 'Program', node: node.programs })
          case 'GroupSearchResult':
            return renderGroupResults({ searchType: 'Group', node: node.groups })
          case 'TaskSearchResult':
            return renderGroupResults({ searchType: 'Task', node: node.tasks })
          case 'ControlObjectiveSearchResult':
            return renderGroupResults({ searchType: 'ControlObjective', node: node.controlObjectives })
          case 'ControlSearchResult':
            return renderGroupResults({ searchType: 'Control', node: node.controls })
          case 'SubcontrolSearchResult':
            return renderGroupResults({ searchType: 'Subcontrol', node: node.subcontrols })
          case 'RiskSearchResult':
            return renderGroupResults({ searchType: 'Risk', node: node.risks })
          default:
            return null
        }
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
      {node.map((searchNode: any) => renderSearchResultField({ node: searchNode }))}
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
      {node.map((searchNode: any) => renderOrgSearchResultField({ node: searchNode, handleOrganizationSwitch, setQuery }))}
    </CommandGroup>
  )
}

// renderOrgSearchResultField is specific for organizations which switches into the organization rather than redirecting to the page
const renderOrgSearchResultField = ({ node, handleOrganizationSwitch, setQuery }: SearchGroupProps) => {
  if (handleOrganizationSwitch === undefined || setQuery === undefined) {
    return
  }

  const { item, avatarRow } = searchStyles()
  const image = node?.avatarFile?.presignedURL || node?.avatarRemoteURL

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
          <Avatar variant="medium" className="mr-2">
            {image && <AvatarImage src={image} />}
            <AvatarFallback>{node?.name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
          {node.displayName}
        </div>
      </div>
    </CommandItem>
  )
}

// renderSearchResultField is a generic function to render search result for any type of entity
const renderSearchResultField = ({ node }: SearchGroupProps) => {
  const { item } = searchStyles()

  const nodeType = node.__typename.toLowerCase()

  return (
    <CommandItem className={item()} key={node.id} onSelect={() => (window.location.href = `/${nodeType}/${node.id}`)}>
      <Link href={`/${nodeType}/${node.id}`}>
        <div>{node.name}</div>
      </Link>
    </CommandItem>
  )
}
