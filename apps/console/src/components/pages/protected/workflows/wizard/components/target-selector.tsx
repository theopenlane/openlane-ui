import { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Badge } from '@repo/ui/badge'
import { Label } from '@repo/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { X, KeyRound } from 'lucide-react'
import type { User, Group } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import type { TargetSelectorProps } from '../types'
import { buildTargetKey, formatResolverLabel } from '../utils'

const ResolverIcon = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const iconClass = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-avatar text-button-text`}>
      <KeyRound className={iconClass} />
    </div>
  )
}

export const TargetSelector = ({ targets, onAdd, onRemove, resolverKeys, getTargetLabel, error }: TargetSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText, 300)

  const searchWhere = debouncedSearch.trim() ? { hasUserWith: [{ displayNameContainsFold: debouncedSearch.trim() }] } : undefined
  const { members, isLoading: isLoadingUsers } = useGetOrgMemberships({ where: searchWhere })
  const userMap = useMemo(() => {
    const map = new Map<string, User>()
    for (const m of members) {
      if (m?.user) map.set(m.user.id, m.user as User)
    }
    return map
  }, [members])
  const userOptions = useMemo(() => Array.from(userMap.values()).map((u) => ({ label: u.displayName || '', value: u.id })), [userMap])

  const groupSearchWhere = debouncedSearch.trim() ? { displayNameContainsFold: debouncedSearch.trim() } : undefined
  const { groups, isLoading: isLoadingGroups } = useGetAllGroups({ where: groupSearchWhere })
  const groupMap = useMemo(() => {
    const map = new Map<string, Group>()
    for (const g of groups) {
      if (g?.id) map.set(g.id, g)
    }
    return map
  }, [groups])
  const groupOptions = useMemo(() => groups.map((g) => ({ label: g.displayName || '', value: g.id || '' })), [groups])

  const selectedKeys = useMemo(() => new Set(targets.map(buildTargetKey)), [targets])

  const filteredUsers = useMemo(() => userOptions.filter((u) => !selectedKeys.has(`USER:${u.value}`)), [userOptions, selectedKeys])
  const filteredGroups = useMemo(() => groupOptions.filter((g) => !selectedKeys.has(`GROUP:${g.value}`)), [groupOptions, selectedKeys])
  const filteredResolvers = useMemo(() => {
    const lowerSearch = debouncedSearch.trim().toLowerCase()
    return resolverKeys
      .map((key) => ({ label: formatResolverLabel(key), value: key }))
      .filter((r) => !selectedKeys.has(`RESOLVER:${r.value}`))
      .filter((r) => !lowerSearch || r.label.toLowerCase().includes(lowerSearch))
  }, [resolverKeys, selectedKeys, debouncedSearch])

  const isLoading = isLoadingUsers || isLoadingGroups
  const hasResults = filteredUsers.length > 0 || filteredGroups.length > 0 || filteredResolvers.length > 0

  return (
    <div className="space-y-3">
      {resolverKeys.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Suggested resolvers</p>
          <div className="flex flex-wrap gap-2">
            {resolverKeys
              .filter((key) => !selectedKeys.has(`RESOLVER:${key}`))
              .map((key) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="flex cursor-pointer items-center gap-1.5 pr-2 pl-1 hover:border-primary/60"
                  onClick={() => onAdd({ type: 'RESOLVER', resolver_key: key })}
                >
                  <ResolverIcon />
                  <span>{formatResolverLabel(key)}</span>
                </Badge>
              ))}
          </div>
        </div>
      )}

      <div>
        <Label className="mb-2 block">Selected recipients</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-input px-3 py-2 text-sm">
              {targets.length > 0 ? (
                targets.map((target) => {
                  const label = getTargetLabel(target)
                  return (
                    <Badge key={buildTargetKey(target)} variant="outline" className="flex items-center gap-1.5 pr-1 pl-1">
                      {target.type === 'RESOLVER' ? (
                        <ResolverIcon />
                      ) : target.type === 'GROUP' ? (
                        <Avatar entity={groupMap.get(target.id ?? '') as Group | undefined} variant="small" />
                      ) : (
                        <Avatar entity={userMap.get(target.id ?? '') as User | undefined} variant="small" />
                      )}
                      <span>{label}</span>
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(target)
                        }}
                      />
                    </Badge>
                  )
                })
              ) : (
                <span className="text-muted-foreground">Search and select recipients...</span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
            <Command shouldFilter={false}>
              <CommandInput placeholder="Search users, groups, or resolvers..." value={searchText} onValueChange={setSearchText} />
              <CommandList>
                <CommandEmpty>{isLoading ? 'Loading...' : 'No results found.'}</CommandEmpty>

                {filteredUsers.length > 0 && (
                  <CommandGroup heading="Users">
                    {filteredUsers.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          onAdd({ type: 'USER', id: option.value })
                          setSearchText('')
                        }}
                      >
                        <Avatar entity={userMap.get(option.value) as User | undefined} variant="small" />
                        <span className="ml-2">{option.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {filteredGroups.length > 0 && (
                  <CommandGroup heading="Groups">
                    {filteredGroups.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          onAdd({ type: 'GROUP', id: option.value })
                          setSearchText('')
                        }}
                      >
                        <Avatar entity={groupMap.get(option.value) as Group | undefined} variant="small" />
                        <span className="ml-2">{option.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {filteredResolvers.length > 0 && (
                  <CommandGroup heading="Resolvers">
                    {filteredResolvers.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          onAdd({ type: 'RESOLVER', resolver_key: option.value })
                          setSearchText('')
                        }}
                      >
                        <ResolverIcon size="md" />
                        <span className="ml-2">{option.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {!isLoading && !hasResults && debouncedSearch.trim() && <CommandEmpty>No results found.</CommandEmpty>}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
