'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Button } from '@repo/ui/button'
import { Check, Trash2, X, Users, UserRound } from 'lucide-react'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { isValidEmail } from '@/lib/validators'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { useContacts } from '@/lib/graphql-hooks/contact'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'

export type TargetTab = 'csv' | 'manual' | 'contacts' | 'personnel'

export interface CampaignTargetEntry {
  email: string
  fullName: string
  contactID?: string
  userID?: string
}

interface TargetsStepProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: (targets: CampaignTargetEntry[]) => void
  uploadedFile: File | null
  onFileUpload: (file: File | null) => void
  activeTab: TargetTab
  onActiveTabChange: (tab: TargetTab) => void
}

type SelectableItem = {
  id: string
  email: string
  name: string
  source: 'contact' | 'personnel'
}

const RecipientMultiSelect: React.FC<{
  items: SelectableItem[]
  isLoading: boolean
  selected: CampaignTargetEntry[]
  onToggle: (item: SelectableItem) => void
  onRemove: (email: string) => void
  searchText: string
  onSearchChange: (text: string) => void
  placeholder: string
  icon: React.ReactNode
}> = ({ items, isLoading, selected, onToggle, onRemove, searchText, onSearchChange, placeholder, icon }) => {
  const [open, setOpen] = useState(false)

  const selectedEmails = useMemo(() => new Set(selected.map((s) => s.email)), [selected])

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-input px-3 py-2 text-sm">
            {selected.length > 0 ? (
              selected.map((entry) => (
                <Badge key={entry.email} variant="outline" className="flex items-center gap-1 pr-1">
                  <span>{entry.fullName || entry.email}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(entry.email)
                    }}
                  />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search by name..." value={searchText} onValueChange={onSearchChange} />
            <CommandList>
              <CommandEmpty>{isLoading ? 'Loading...' : 'No results found.'}</CommandEmpty>
              {items.length > 0 && (
                <CommandGroup>
                  {items.map((item) => {
                    const isSelected = selectedEmails.has(item.email)
                    return (
                      <CommandItem key={item.id} value={item.id} onSelect={() => onToggle(item)}>
                        <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'opacity-50')}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        {icon}
                        <div className="flex flex-col">
                          <span>{item.name || item.email}</span>
                          {item.name && <span className="text-xs text-muted-foreground">{item.email}</span>}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

const ContactsSelector: React.FC<{
  targets: CampaignTargetEntry[]
  onTargetsChange: (targets: CampaignTargetEntry[]) => void
}> = ({ targets, onTargetsChange }) => {
  const [searchText, setSearchText] = useState('')

  const contactTargets = useMemo(() => targets.filter((t) => t.contactID), [targets])

  const { contacts, isLoading } = useContacts({
    where: {
      emailNEQ: '',
      emailNotNil: true,
      ...(searchText.trim() ? { fullNameContainsFold: searchText.trim() } : {}),
    },
    enabled: true,
  })

  const items: SelectableItem[] = useMemo(
    () =>
      contacts
        .filter((c) => c.email)
        .map((c) => ({
          id: c.id,
          email: c.email!,
          name: c.fullName || '',
          source: 'contact' as const,
        })),
    [contacts],
  )

  const handleToggle = useCallback(
    (item: SelectableItem) => {
      const exists = targets.find((t) => t.contactID === item.id)
      if (exists) {
        onTargetsChange(targets.filter((t) => t.contactID !== item.id))
      } else {
        onTargetsChange([...targets, { email: item.email, fullName: item.name, contactID: item.id }])
      }
    },
    [targets, onTargetsChange],
  )

  const handleRemove = useCallback(
    (email: string) => {
      onTargetsChange(targets.filter((t) => t.email !== email || !t.contactID))
    },
    [targets, onTargetsChange],
  )

  return (
    <RecipientMultiSelect
      items={items}
      isLoading={isLoading}
      selected={contactTargets}
      onToggle={handleToggle}
      onRemove={handleRemove}
      searchText={searchText}
      onSearchChange={setSearchText}
      placeholder="Search and select contacts..."
      icon={<Users className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />}
    />
  )
}

const PersonnelSelector: React.FC<{
  targets: CampaignTargetEntry[]
  onTargetsChange: (targets: CampaignTargetEntry[]) => void
}> = ({ targets, onTargetsChange }) => {
  const [searchText, setSearchText] = useState('')

  const personnelTargets = useMemo(() => targets.filter((t) => t.userID), [targets])

  const { members, isLoading } = useGetOrgMemberships({
    where: {
      ...(searchText.trim() ? { hasUserWith: [{ displayNameContainsFold: searchText.trim() }] } : {}),
    },
    enabled: true,
  })

  const items: SelectableItem[] = useMemo(
    () =>
      members
        .filter((m) => m?.user?.email)
        .map((m) => ({
          id: m.user.id,
          email: m.user.email,
          name: m.user.displayName || '',
          source: 'personnel' as const,
        })),
    [members],
  )

  const handleToggle = useCallback(
    (item: SelectableItem) => {
      const exists = targets.find((t) => t.userID === item.id)
      if (exists) {
        onTargetsChange(targets.filter((t) => t.userID !== item.id))
      } else {
        onTargetsChange([...targets, { email: item.email, fullName: item.name, userID: item.id }])
      }
    },
    [targets, onTargetsChange],
  )

  const handleRemove = useCallback(
    (email: string) => {
      onTargetsChange(targets.filter((t) => t.email !== email || !t.userID))
    },
    [targets, onTargetsChange],
  )

  return (
    <RecipientMultiSelect
      items={items}
      isLoading={isLoading}
      selected={personnelTargets}
      onToggle={handleToggle}
      onRemove={handleRemove}
      searchText={searchText}
      onSearchChange={setSearchText}
      placeholder="Search and select personnel..."
      icon={<UserRound className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />}
    />
  )
}

export const TargetsStep: React.FC<TargetsStepProps> = ({ targets, onTargetsChange, uploadedFile, onFileUpload, activeTab, onActiveTabChange }) => {
  const [manualTargets, setManualTargets] = useState<CampaignTargetEntry[]>([])
  const [contactTargets, setContactTargets] = useState<CampaignTargetEntry[]>([])
  const [personnelTargets, setPersonnelTargets] = useState<CampaignTargetEntry[]>([])

  const syncActiveTargets = useCallback(
    (tab: TargetTab, manual: CampaignTargetEntry[], contacts: CampaignTargetEntry[], personnel: CampaignTargetEntry[]) => {
      switch (tab) {
        case 'manual':
          return onTargetsChange(manual)
        case 'contacts':
          return onTargetsChange(contacts)
        case 'personnel':
          return onTargetsChange(personnel)
        default:
          return onTargetsChange([])
      }
    },
    [onTargetsChange],
  )

  const handleTabChange = useCallback(
    (tab: string) => {
      const t = tab as TargetTab
      onActiveTabChange(t)
      syncActiveTargets(t, manualTargets, contactTargets, personnelTargets)
    },
    [onActiveTabChange, syncActiveTargets, manualTargets, contactTargets, personnelTargets],
  )

  const handleFileUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      onFileUpload(uploaded.file)
    }
  }

  const selectedOptions: Option[] = useMemo(() => manualTargets.map((t) => ({ value: t.email, label: t.email })), [manualTargets])

  const handleManualChange = useCallback(
    (options: Option[]) => {
      const manual = options.map((o) => ({ email: o.value, fullName: '' }))
      setManualTargets(manual)
      onTargetsChange(manual)
    },
    [onTargetsChange],
  )

  const handleContactTargetsChange = useCallback(
    (updated: CampaignTargetEntry[]) => {
      setContactTargets(updated)
      onTargetsChange(updated)
    },
    [onTargetsChange],
  )

  const handlePersonnelTargetsChange = useCallback(
    (updated: CampaignTargetEntry[]) => {
      setPersonnelTargets(updated)
      onTargetsChange(updated)
    },
    [onTargetsChange],
  )

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="csv">Upload CSV</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="personnel">Personnel</TabsTrigger>
      </TabsList>

      <TabsContent value="csv" forceMount className={`mt-4 ${activeTab !== 'csv' ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Upload (CSV)</label>
          {uploadedFile ? (
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm">{uploadedFile.name}</span>
              <Button variant="icon" onClick={() => onFileUpload(null)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ) : (
            <FileUpload onFileUpload={handleFileUpload} maxFileSizeInMb={3} acceptedFileTypes={['text/csv', 'application/vnd.ms-excel']} acceptedFileTypesShort={['.csv', '.xls']} multipleFiles={false} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="manual" forceMount className={`mt-4 ${activeTab !== 'manual' ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Enter emails</label>
          <MultipleSelector
            value={selectedOptions}
            onChange={handleManualChange}
            creatable
            placeholder="Type an email and press Enter..."
            hidePlaceholderWhenSelected
            hideClearAllButton
            className="h-[400px] items-start overflow-y-auto"
            commandProps={{
              filter: (value: string, search: string) => {
                return isValidEmail(search) && value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1
              },
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="contacts" forceMount className={`mt-4 ${activeTab !== 'contacts' ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Select from contacts</label>
          <ContactsSelector targets={contactTargets} onTargetsChange={handleContactTargetsChange} />
        </div>
      </TabsContent>

      <TabsContent value="personnel" forceMount className={`mt-4 ${activeTab !== 'personnel' ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Select from personnel</label>
          <PersonnelSelector targets={personnelTargets} onTargetsChange={handlePersonnelTargetsChange} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
