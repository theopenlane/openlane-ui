import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { Clock8, LoaderCircle, Search, SearchIcon } from 'lucide-react'

import { Button } from '@repo/ui/button'
import { Command, CommandEmpty, CommandItem, CommandList } from '@repo/ui/command'
import { Dialog, DialogContent, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ObjectTypes } from '@repo/codegen/src/type-names'

import { switchOrganization, handleSSORedirect } from '@/lib/user'
import { useSearch, type SearchContextGroup, type SearchContextResult } from '@/lib/graphql-hooks/search'
import { searchStyles } from './search.styles'
import { generateSelectOptions, getEntityTypeLabel, getSearchResultCount, searchTypeIcons } from './search-config'
import { type RoutePage } from '@/types'
import { useSearchHistory } from './useSearchHistory'
import { getHrefForSearchEntityType } from '@/utils/getHrefForObjectType'
import { splitTextByQuery } from './search-utils'

const highlightQueryMatch = (text: string, query: string) => {
  const parts = splitTextByQuery(text, query)

  return parts.map((part, index) => {
    if (part.isMatch) {
      return (
        <strong key={`${part.text}-${index}`} className="font-semibold text-input-text">
          {part.text}
        </strong>
      )
    }

    return <React.Fragment key={`${part.text}-${index}`}>{part.text}</React.Fragment>
  })
}

const primaryLabelSnippetFields: Partial<Record<string, string[]>> = {
  Program: ['name'],
  Risk: ['name'],
  Procedure: ['name'],
  Template: ['name'],
  Group: ['name', 'displayName'],
  Organization: ['name', 'displayName'],
  Evidence: ['name'],
  Task: ['title'],
}

const normalizeSnippetField = (field: string) => field.replace(/[\s_-]+/g, '').toLowerCase()

const getVisibleMatchedFields = (result: SearchContextResult) => {
  if (result.entityType !== 'Group' && result.entityType !== 'Organization') {
    return result.matchedFields
  }

  return result.matchedFields.filter((field) => normalizeSnippetField(field) === 'displayname')
}

const getVisibleSnippets = (result: SearchContextResult) => {
  const primaryFields = primaryLabelSnippetFields[result.entityType]
  if (!primaryFields?.length) {
    return result.snippets
  }

  const normalizedPrimaryFields = new Set(primaryFields.map((field) => normalizeSnippetField(field)))

  return result.snippets.filter((snippet) => !normalizedPrimaryFields.has(normalizeSnippetField(snippet.field)))
}

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

  const { isFetching, pages, contextGroups } = useSearch(debouncedQuery)

  const close = () => setOpen(false)

  const selectOptionsWithCounts = useMemo(() => {
    if (query.length < 3) {
      return generateSelectOptions([], [])
    }

    return generateSelectOptions(contextGroups, pages)
  }, [contextGroups, pages, query])

  const selectedTypeValue = selectOptionsWithCounts.some((option) => option.value === selectedType) ? selectedType : 'All'

  const selectedCount = useMemo(() => {
    return getSearchResultCount(selectedTypeValue, contextGroups, pages)
  }, [selectedTypeValue, contextGroups, pages])

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
        setOpen((isOpen) => !isOpen)
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // add search term to history when there are results
  useEffect(() => {
    const hasData = contextGroups.some((group) => group.results.length > 0) || pages.length > 0
    if (debouncedQuery.length > 2 && hasData) {
      addTerm(debouncedQuery)
    }
  }, [contextGroups, debouncedQuery, addTerm, pages.length])

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
      <DialogTrigger className="p-1 rounded-md h-8 w-8 items-center justify-center flex" asChild>
        <Button
          variant="secondary"
          className="p-1 rounded-md h-8 w-8 items-center justify-center flex"
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
          <Select value={selectedTypeValue} onValueChange={setSelectedType}>
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
        <Command className="bg-panel">
          <div className="hidden" />
          {selectedCount === 0
            ? renderNoResults()
            : renderSearchResults({
                contextGroups,
                handleOrganizationSwitch,
                setQuery,
                query,
                selectedType: selectedTypeValue,
                pages,
                close,
              })}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const renderNoResults = () => {
  return (
    <CommandList>
      <CommandEmpty>No results found</CommandEmpty>
    </CommandList>
  )
}

const renderRouteResults = (routes: { name: string; route: string }[], query: string, close: () => void) => {
  const { icon, leftFlex } = searchStyles()
  const Icon = searchTypeIcons.Pages

  return (
    <>
      {routes.map((route) => {
        return (
          <Link key={route.route} href={route.route} onClick={close}>
            <div className="border-b py-1">
              <CommandItem value={route.route} className="cursor-pointer py-2 rounded-md">
                <div className="flex">
                  <div className={leftFlex()}>
                    {Icon && <Icon className={icon()} />}
                    <p className="font-medium text-text-informational">Page</p>
                  </div>
                  <span className="text-text-informational"> {highlightQueryMatch(route.route, query)}</span>
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
  contextGroups: SearchContextGroup[]
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
  query: string
  selectedType: string
  pages: RoutePage[]
  close: () => void
}

const renderSearchResults = ({ contextGroups, handleOrganizationSwitch, setQuery, query, selectedType, pages, close }: SearchProps) => {
  const shouldRenderSection = (type: string) => {
    return selectedType === 'All' || selectedType === type
  }

  return (
    <div className="flex flex-col">
      <div className="px-2 py-1 border-b" />

      <CommandList key="search-results" className="max-h-[600px] overflow-auto px-2">
        {shouldRenderSection('Pages') && !!pages.length && renderRouteResults(pages, query, close)}

        {contextGroups
          .filter((group) => shouldRenderSection(group.entityType) && group.results.length > 0)
          .map((group) => (
            <div key={group.entityType}>
              <div className="px-2 py-1">
                <p className="text-xs font-medium uppercase text-text-informational">{getEntityTypeLabel(group.entityType)}</p>
              </div>
              {group.results.map((result) => (
                <SearchContextResultItem
                  key={`${group.entityType}-${result.entityID}`}
                  result={result}
                  sectionType={group.entityType}
                  query={query}
                  close={close}
                  handleOrganizationSwitch={handleOrganizationSwitch}
                  setQuery={setQuery}
                />
              ))}
            </div>
          ))}
      </CommandList>
    </div>
  )
}

interface SearchContextResultItemProps {
  result: SearchContextResult
  sectionType: string
  query: string
  close: () => void
  handleOrganizationSwitch?: (orgId?: string) => Promise<void>
  setQuery?: React.Dispatch<React.SetStateAction<string>>
}

const SearchContextResultItem = ({ result, sectionType, query, close, handleOrganizationSwitch, setQuery }: SearchContextResultItemProps) => {
  const { icon, leftFlex } = searchStyles()

  const isOrganization = result.entityType === ObjectTypes.ORGANIZATION
  const visibleMatchedFields = getVisibleMatchedFields(result)
  const matchedFieldLabel = visibleMatchedFields.length > 0 ? visibleMatchedFields.join(', ') : 'None'
  const visibleSnippets = getVisibleSnippets(result)
  const href = getHrefForSearchEntityType(result.entityType, result.entityID, {
    subcontrolParentId: result.subcontrolParentId,
    controlOwnerID: result.controlOwnerID,
    controlStandardID: result.controlStandardID,
  })

  const Icon = searchTypeIcons[sectionType] ?? searchTypeIcons[result.entityType] ?? searchTypeIcons.Pages

  const content = (
    <div className="border-b py-1">
      <CommandItem
        value={`${result.entityType}-${result.entityID}`}
        className="cursor-pointer py-2 rounded-md"
        onSelect={
          isOrganization && handleOrganizationSwitch && setQuery
            ? () => {
                setQuery('')
                handleOrganizationSwitch(result.entityID)
              }
            : undefined
        }
      >
        <div className="flex w-full">
          <div className={leftFlex()}>
            {Icon && <Icon className={icon()} />}
            <p className="font-medium text-text-informational">{getEntityTypeLabel(sectionType)}</p>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium text-input-text break-words">{result.primaryLabel || result.entityID}</p>
            <p className="text-xs text-text-informational">Matched fields: {matchedFieldLabel}</p>
            {visibleSnippets.length > 0 ? (
              <div className="space-y-1">
                {visibleSnippets.map((snippet, index) => (
                  <p key={`${snippet.field}-${index}`} className="text-sm text-input-text break-words">
                    <span className="text-text-informational">{snippet.field}:</span> {highlightQueryMatch(snippet.text, query)}
                  </p>
                ))}
              </div>
            ) : result.snippets.length === 0 ? (
              <p className="text-sm text-input-text">{result.entityID}</p>
            ) : null}
          </div>
        </div>
      </CommandItem>
    </div>
  )

  if (href) {
    return (
      <Link href={href} onClick={close}>
        {content}
      </Link>
    )
  }

  return content
}
