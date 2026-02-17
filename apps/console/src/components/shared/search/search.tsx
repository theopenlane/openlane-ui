import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { switchOrganization, handleSSORedirect } from '@/lib/user'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { searchStyles } from './search.styles'
import { Command, CommandEmpty, CommandItem, CommandList } from '@repo/ui/command'
import { Input } from '@repo/ui/input'
import { Clock8, LoaderCircle, Search, SearchIcon } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import { useSearch } from '@/lib/graphql-hooks/search'
import { Organization, SearchQuery } from '@repo/codegen/src/schema'
import { Avatar } from '../avatar/avatar'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { Dialog, DialogContent, DialogTrigger } from '@repo/ui/dialog'
import { generateSelectOptions, getSearchResultCount, searchTypeIcons } from './search-config'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { RoutePage } from '@/types'
import { useSearchHistory } from './useSearchHistory'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@repo/ui/button'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type ProgramNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['programs']>['edges']>[number]>['node']

type GroupNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['groups']>['edges']>[number]>['node']

type TaskNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['tasks']>['edges']>[number]>['node']

type ControlNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['controls']>['edges']>[number]>['node']

type SubcontrolNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['subcontrols']>['edges']>[number]>['node']

type RiskNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['risks']>['edges']>[number]>['node']

type OrganizationNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['organizations']>['edges']>[number]>['node']

type PolicyNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['internalPolicies']>['edges']>[number]>['node']

type ProcedureNode = NonNullable<NonNullable<NonNullable<NonNullable<SearchQuery['search']>['procedures']>['edges']>[number]>['node']

export const GlobalSearch = () => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const cmdInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedType, setSelectedType] = useState<string>('All')

  const { history: searchHistory, addTerm } = useSearchHistory()

  const { data: sessionData, update: updateSession } = useSession()
  const { push } = useRouter()

  const debouncedQuery = useDebounce(query, 300)

  const { data, isFetching, pages } = useSearch(debouncedQuery)

  const previousOptionsRef = useRef<{ label: string; value: string }[]>([])

  const close = () => setOpen(false)

  const selectOptionsWithCounts = useMemo(() => {
    if (query.length < 3) {
      const options = generateSelectOptions(undefined, [])
      previousOptionsRef.current = options
      return options
    }
    if (data?.search && !isFetching) {
      const options = generateSelectOptions(data, pages)
      previousOptionsRef.current = options
      return options
    }

    if (!previousOptionsRef.current.length) {
      const options = generateSelectOptions(data, pages)
      previousOptionsRef.current = options
      return options
    }

    return previousOptionsRef.current
  }, [data, pages, isFetching, query])

  const selectedCount = useMemo(() => {
    return getSearchResultCount(selectedType, data, pages)
  }, [selectedType, data, pages])

  // when the organization is selected, switch the organization and redirect to the dashboard
  const handleOrganizationSwitch = async (orgId?: string) => {
    close()
    if (orgId) {
      const response = await switchOrganization({
        target_organization_id: orgId,
      })

      if (handleSSORedirect(response)) {
        return
      }

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
      requestAnimationFrame(() => {
        queryClient?.clear()
      })
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

  // open the popover when the data is fetched
  useEffect(() => {
    const hasData = (data && data.search && Object.values(data.search).some((val) => val !== null)) || pages.length
    if (debouncedQuery.length > 2 && hasData) {
      addTerm(debouncedQuery)
    }
  }, [data, isFetching, debouncedQuery, addTerm, pages.length])

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={`p-1 rounded-md h-8 w-8 items-center justify-center flex`} asChild>
        <Button
          variant="secondary"
          className={`p-1 rounded-md h-8 w-8 items-center justify-center flex`}
          onClick={() => {
            setOpen(true)
          }}
        >
          <Search size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 max-w-[573px]" autoFocus>
        <div className="mt-1.5">
          <Input
            ref={inputRef}
            placeholder="Search..."
            icon={isFetching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            className="!border-none !h-9 pr-14 cursor-pointer bg-transparent"
            iconPosition="left"
            onKeyDown={relayInputKeyDownToCommand}
          />
        </div>
        <div className="flex px-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[176px] shrink-0">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {selectOptionsWithCounts.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="border-r mx-3" />
          <Clock8 size={16} className="self-center shrink-0" />
          {/* history dropdown/list */}
          <div className="overflow-hidden w-80">
            {searchHistory.length > 0 && (
              <div className="p-2 flex w-full gap-1 ">
                {searchHistory.map((term) => (
                  <div
                    key={term}
                    className="px-2.5 py-1 cursor-pointer bg-card rounded-xl text-xs"
                    onClick={() => {
                      setQuery(term)
                    }}
                  >
                    {term}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Replace this with your custom search results UI */}
        <Command className="bg-panel">
          {/* Optional: hidden element to capture key events */}
          <div className="hidden" />
          {selectedCount === 0
            ? renderNoResults()
            : renderSearchResults({
                data,
                handleOrganizationSwitch,
                setQuery,
                query,
                selectedType,
                pages,
                close,
              })}
        </Command>
      </DialogContent>
    </Dialog>
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

const renderRouteResults = (routes: { name: string; route: string }[], query: string, close: () => void) => {
  const { icon, leftFlex } = searchStyles()

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query})`, 'ig')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-input-text">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }
  return (
    <>
      {routes.map((route) => {
        const Icon = searchTypeIcons['Pages']

        return (
          <Link key={route.route} href={route.route} onClick={close}>
            <div className="border-b py-1">
              <CommandItem className="cursor-pointer py-2 rounded-md">
                <div className="flex">
                  <div className={leftFlex()}>
                    {Icon && <Icon className={icon()} />}
                    <p className="font-medium text-text-informational">Page</p>
                  </div>
                  <span className="text-text-informational"> {highlightMatch(route.route, query)}</span>
                </div>
              </CommandItem>
            </div>
          </Link>
        )
      })}
    </>
  )
}

interface SearchProps {
  data: SearchQuery | undefined
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
  query: string
  selectedType: string
  pages: RoutePage[]
  close: () => void
}

const renderSearchResults = ({ data, handleOrganizationSwitch, setQuery, query, selectedType, pages, close }: SearchProps) => {
  if (!data?.search) return null

  const { search } = data

  const shouldRenderSection = (type: string) => {
    return selectedType === 'All' || selectedType === type
  }

  return (
    <div className="flex flex-col">
      {/* Type selector */}
      <div className="px-2 py-1 border-b"></div>

      <CommandList key="search-results" className="max-h-[600px] overflow-auto px-2">
        {/* Pages */}
        {shouldRenderSection('Pages') && !!pages.length && renderRouteResults(pages, query, close)}
        {/* /* Organizations */}
        {shouldRenderSection('Organizations') &&
          !!search?.organizations?.edges?.length &&
          renderOrgResults({
            close,
            searchType: 'Organizations',
            nodes: (search.organizations.edges ?? []).map((edge): OrganizationNode => edge?.node),
            handleOrganizationSwitch,
            setQuery,
          })}
        {/* /* Programs */}
        {shouldRenderSection('Programs') &&
          !!search.programs?.edges?.length &&
          renderResults({
            close,
            searchType: 'Programs',
            nodes: (search.programs.edges ?? []).map((edge) => edge?.node),
          })}
        {shouldRenderSection('Policies') &&
          !!search?.internalPolicies?.edges?.length &&
          renderResults({
            close,
            searchType: 'Policies',
            nodes: (search?.internalPolicies.edges ?? []).map((edge) => edge?.node),
          })}
        {shouldRenderSection('Procedures') &&
          !!search?.procedures?.edges?.length &&
          renderResults({
            close,
            searchType: 'Procedures',
            nodes: (search?.procedures.edges ?? []).map((edge) => edge?.node),
          })}
        {/* /* Groups */}
        {shouldRenderSection('Groups') &&
          !!search.groups?.edges?.length &&
          renderResults({
            close,
            searchType: 'Groups',
            nodes: (search.groups.edges ?? []).map((edge) => edge?.node),
          })}
        {/* /* Tasks */}
        {shouldRenderSection('Tasks') &&
          !!search.tasks?.edges?.length &&
          renderResults({
            close,
            searchType: 'Tasks',
            nodes: (search.tasks.edges ?? []).map((edge) => edge?.node),
          })}

        {/* /* Controls */}
        {shouldRenderSection('Controls') &&
          !!search.controls?.edges?.length &&
          renderResults({
            close,
            searchType: 'Controls',
            nodes: (search.controls.edges ?? []).map((edge) => edge?.node),
          })}
        {/* /* Subcontrols */}
        {shouldRenderSection('Subcontrols') &&
          !!search.subcontrols?.edges?.length &&
          renderResults({
            close,
            searchType: 'Subcontrols',
            nodes: (search.subcontrols.edges ?? []).map((edge) => edge?.node),
          })}
        {/* /* Risks */}
        {shouldRenderSection('Risks') &&
          !!search.risks?.edges?.length &&
          renderResults({
            close,
            searchType: 'Risks',
            nodes: (search.risks.edges ?? []).map((edge) => edge?.node),
          })}
      </CommandList>
    </div>
  )
}

type ResponseNodes = ProgramNode[] | GroupNode[] | TaskNode[] | ControlNode[] | SubcontrolNode[] | RiskNode[] | PolicyNode[] | ProcedureNode[]

interface SearchNodeProps {
  searchType: string
  nodes: ResponseNodes
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
  close: () => void
}

const renderResults = ({ searchType, nodes, close }: SearchNodeProps) => {
  const { icon, leftFlex } = searchStyles()

  const groupKey = `${searchType.toLowerCase()}`
  const Icon = searchTypeIcons[searchType]

  const renderName = (searchNode: ResponseNodes[number]): string => {
    switch (searchNode?.__typename) {
      case ObjectTypes.CONTROL:
      case ObjectTypes.SUBCONTROL:
        return searchNode.refCode
      case ObjectTypes.PROGRAM:
      case ObjectTypes.GROUP:
      case ObjectTypes.RISK:
      case ObjectTypes.INTERNAL_POLICY:
      case ObjectTypes.PROCEDURE:
        return searchNode.name
      case ObjectTypes.TASK:
        return searchNode.title
      default:
        return 'Unnamed'
    }
  }

  const generateObjectTypeLabel = (searchNode: ResponseNodes[number]): string => {
    switch (searchNode?.__typename) {
      case ObjectTypes.CONTROL: {
        return searchNode.ownerID ? 'Controls' : 'Standard Controls'
      }
      default:
        return searchType
    }
  }

  return (
    <>
      {nodes?.map((searchNode, i: number) => {
        const label = generateObjectTypeLabel(searchNode)
        const nodeType = label.toLowerCase()
        let href
        if (searchNode) {
          href = getHrefForObjectType(nodeType, searchNode)
        }
        const content = (
          <div className="border-b py-1">
            <CommandItem className="cursor-pointer py-2 rounded-md">
              <div className="flex">
                <div className={leftFlex()}>
                  {Icon && <Icon className={icon()} />}
                  <p className="font-medium text-text-informational">{label}</p>
                </div>
                <p className="text-input-text">{renderName(searchNode)}</p>
              </div>
            </CommandItem>
          </div>
        )

        return href ? (
          <Link key={groupKey + i} href={href} onClick={close}>
            {content}
          </Link>
        ) : (
          <div key={groupKey + i}>{content}</div>
        )
      })}
    </>
  )
}

interface SearchOrgNodeProps {
  searchType: string
  nodes: OrganizationNode[]
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
  close: () => void
}

const renderOrgResults = ({ searchType, nodes, handleOrganizationSwitch, setQuery }: SearchOrgNodeProps) => {
  const { avatarRow, icon, leftFlex } = searchStyles()

  if (!handleOrganizationSwitch || !setQuery) return

  const Icon = searchTypeIcons[searchType]

  return (
    <>
      {nodes.map((searchNode: OrganizationNode) => {
        return (
          <div key={searchNode?.id} className="border-b py-1">
            <CommandItem
              className="cursor-pointer py-2 rounded-md bg-panel"
              onSelect={() => {
                setQuery('')
                handleOrganizationSwitch(searchNode?.id)
              }}
            >
              <div className="flex">
                <div className={leftFlex()}>
                  {Icon && <Icon className={icon()} />}
                  <p className="font-medium">{searchType}</p>
                </div>
                <div className={avatarRow()}>
                  <Avatar entity={searchNode as Organization} />
                  <p className="text-input-text">{searchNode?.displayName}</p>
                </div>
              </div>
            </CommandItem>
          </div>
        )
      })}
    </>
  )
}
