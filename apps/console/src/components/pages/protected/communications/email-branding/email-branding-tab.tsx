'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, LoaderCircle, Palette, SaveIcon, SquarePlus, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Switch } from '@repo/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useEmailBrandingsWithFilter, useCreateEmailBranding, useUpdateEmailBranding, useDeleteEmailBranding } from '@/lib/graphql-hooks/email-branding'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailBrandingFont } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDate } from '@/utils/date'

const FONT_OPTIONS = Object.values(EmailBrandingFont).map((value) => ({
  label: getEnumLabel(value),
  value,
}))

export const EmailBrandingTab: React.FC = () => {
  const [selectedBrandingId, setSelectedBrandingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [name, setName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [logoRemoteURL, setLogoRemoteURL] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [fontFamily, setFontFamily] = useState<EmailBrandingFont>(EmailBrandingFont.HELVETICA)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [backgroundColor, setBackgroundColor] = useState('#09151D')
  const [primaryColor, setPrimaryColor] = useState('#162431')
  const [secondaryColor, setSecondaryColor] = useState('#9AA5B0')
  const [linkColor, setLinkColor] = useState('#60E8C9')
  const [buttonColor, setButtonColor] = useState('#60E8C9')
  const [buttonTextColor, setButtonTextColor] = useState('#052E2A')

  const { emailBrandingsNodes, isLoading } = useEmailBrandingsWithFilter({ where: {} })
  const { mutateAsync: createBranding, isPending: isSavingCreate } = useCreateEmailBranding()
  const { mutateAsync: updateBranding, isPending: isSavingUpdate } = useUpdateEmailBranding()
  const { mutateAsync: deleteBranding } = useDeleteEmailBranding()
  const { successNotification, errorNotification } = useNotification()

  const userIds = useMemo(() => {
    const ids = new Set<string>()
    emailBrandingsNodes.forEach((b) => {
      if (b.createdBy) ids.add(b.createdBy)
      if (b.updatedBy) ids.add(b.updatedBy)
    })
    return Array.from(ids)
  }, [emailBrandingsNodes])

  const { users } = useGetOrgUserList({ where: { hasUserWith: [{ idIn: userIds }] } })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[number]> = {}
    users?.forEach((u) => {
      if (u?.id) map[u.id] = u
    })
    return map
  }, [users])

  const isPending = isSavingCreate || isSavingUpdate

  const selectedBranding = emailBrandingsNodes.find((b) => b.id === selectedBrandingId)

  const selectBranding = useCallback(
    (id: string) => {
      const branding = emailBrandingsNodes.find((b) => b.id === id)
      if (!branding) return

      setSelectedBrandingId(id)
      setIsCreating(false)
      setName(branding.name)
      setBrandName(branding.brandName ?? '')
      setLogoRemoteURL(branding.logoRemoteURL ?? '')
      setIsDefault(branding.isDefault ?? false)
      setFontFamily((branding as { fontFamily?: EmailBrandingFont }).fontFamily ?? EmailBrandingFont.HELVETICA)
      setTextColor(branding.textColor ?? '#FFFFFF')
      setBackgroundColor(branding.backgroundColor ?? '#09151D')
      setPrimaryColor(branding.primaryColor ?? '#162431')
      setSecondaryColor(branding.secondaryColor ?? '#9AA5B0')
      setLinkColor(branding.linkColor ?? '#60E8C9')
      setButtonColor(branding.buttonColor ?? '#60E8C9')
      setButtonTextColor(branding.buttonTextColor ?? '#052E2A')
    },
    [emailBrandingsNodes],
  )

  useEffect(() => {
    if (!selectedBrandingId && !isCreating && emailBrandingsNodes.length > 0) {
      selectBranding(emailBrandingsNodes[0].id)
    }
  }, [emailBrandingsNodes, selectedBrandingId, isCreating, selectBranding])

  const handleCreateNew = () => {
    setSelectedBrandingId(null)
    setIsCreating(true)
    setName('')
    setBrandName('')
    setLogoRemoteURL('')
    setIsDefault(false)
    setFontFamily(EmailBrandingFont.HELVETICA)
    setTextColor('#FFFFFF')
    setBackgroundColor('#09151D')
    setPrimaryColor('#162431')
    setSecondaryColor('#9AA5B0')
    setLinkColor('#60E8C9')
    setButtonColor('#60E8C9')
    setButtonTextColor('#052E2A')
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return

    const trimmedLogoUrl = logoRemoteURL.trim()
    if (trimmedLogoUrl && !isValidUrl(trimmedLogoUrl)) {
      errorNotification({ title: 'Invalid URL', description: 'Please enter a valid logo URL (e.g. https://example.com/logo.png)' })
      return
    }

    const input = {
      name: name.trim(),
      brandName: brandName.trim() || undefined,
      logoRemoteURL: trimmedLogoUrl || undefined,
      isDefault,
      fontFamily,
      textColor,
      backgroundColor,
      primaryColor,
      secondaryColor,
      linkColor,
      buttonColor,
      buttonTextColor,
    }

    try {
      if (isCreating) {
        const result = await createBranding({ input })
        const newId = result?.createEmailBranding?.emailBranding?.id
        if (newId) {
          setSelectedBrandingId(newId)
          setIsCreating(false)
        }
        successNotification({ title: 'Email branding created' })
      } else if (selectedBrandingId) {
        await updateBranding({ updateEmailBrandingId: selectedBrandingId, input })
        successNotification({ title: 'Email branding updated' })
      }
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    if (!selectedBrandingId) return
    try {
      await deleteBranding({ deleteEmailBrandingId: selectedBrandingId })
      successNotification({ title: 'Email branding deleted' })
      setSelectedBrandingId(null)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderCircle className="animate-spin text-muted-foreground" size={24} />
      </div>
    )
  }

  const showForm = isCreating || selectedBrandingId

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Branding Configuration</h3>
            <span className="text-xs text-muted-foreground">
              {emailBrandingsNodes.length} {emailBrandingsNodes.length === 1 ? 'configuration' : 'configurations'} available
            </span>
          </div>
          <div className="flex items-center gap-2">
            {emailBrandingsNodes.length > 0 && (
              <Select
                value={isCreating ? '__new__' : selectedBrandingId ?? ''}
                onValueChange={(val) => {
                  if (val !== '__new__') selectBranding(val)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a configuration" />
                </SelectTrigger>
                <SelectContent>
                  {emailBrandingsNodes.map((branding) => (
                    <SelectItem key={branding.id} value={branding.id}>
                      {branding.name}
                      {branding.isDefault && <span className="ml-1.5 text-xs text-muted-foreground">(Default)</span>}
                    </SelectItem>
                  ))}
                  {isCreating && (
                    <SelectItem value="__new__" disabled>
                      New Config
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            {selectedBrandingId && (
              <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" onClick={() => setDeleteDialogOpen(true)}>
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={handleSave} disabled={isPending || !name.trim()} icon={<SaveIcon size={16} />} iconPosition="left">
              {isPending ? 'Saving...' : 'Save Config'}
            </Button>
            <Button variant="primary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={handleCreateNew}>
              Create New
            </Button>
          </div>
        </div>

        {!showForm ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Palette size={40} className="mb-3 opacity-50" />
            <p className="text-sm">No branding configurations found. Create one to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Set As Default Branding</span>
                <span className="text-xs text-muted-foreground">
                  {isDefault ? 'This branding is the default — enabling this on the default will update all email templates that are currently using this default.' : 'Enable to set this as the default branding for all templates.'}
                </span>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            <Accordion type="multiple" defaultValue={['identity', 'theme', 'metadata']} className="flex flex-col gap-6">
              <AccordionItem value="identity" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Identity</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                          Config Name<span className="text-destructive">*</span>
                        </label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Default Branding" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Brand Name</label>
                        <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Openlane" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Logo Remote URL</label>
                      <Input value={logoRemoteURL} onChange={(e) => setLogoRemoteURL(e.target.value)} placeholder="https://example.com/logo.png" />
                      <p className="text-xs text-muted-foreground">Publicly accessible URL to your logo image (PNG, SVG, or JPEG recommended)</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="theme" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Theme</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4 flex flex-col gap-6">
                    <p className="text-xs text-muted-foreground">Pick the description text for this section</p>

                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-semibold text-muted-foreground">Text</span>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium">Font</label>
                          <Select value={fontFamily} onValueChange={(val) => setFontFamily(val as EmailBrandingFont)}>
                            <SelectTrigger className="w-full">{getEnumLabel(fontFamily)}</SelectTrigger>
                            <SelectContent>
                              {FONT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <ColorInput label="Title Color" value={textColor} onChange={setTextColor} />
                        <ColorInput label="Description Color" value={secondaryColor} onChange={setSecondaryColor} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-semibold text-muted-foreground">Card</span>
                      <div className="grid grid-cols-3 gap-4">
                        <ColorInput label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
                        <ColorInput label="Foreground Color" value={primaryColor} onChange={setPrimaryColor} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-semibold text-muted-foreground">Button</span>
                      <div className="grid grid-cols-3 gap-4">
                        <ColorInput label="Button Color" value={buttonColor} onChange={setButtonColor} />
                        <ColorInput label="Button Text Color" value={buttonTextColor} onChange={setButtonTextColor} />
                        <ColorInput label="Link Color" value={linkColor} onChange={setLinkColor} />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {!isCreating && selectedBranding && (
                <AccordionItem value="metadata" className="rounded-lg border border-border bg-card overflow-hidden">
                  <AccordionTrigger asChild>
                    <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                      <span className="text-sm font-semibold">Metadata</span>
                      <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border-t border-border px-4 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Created</span>
                          <p className="font-medium">{formatDate(selectedBranding.createdAt)}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Updated</span>
                          <p className="font-medium">{formatDate(selectedBranding.updatedAt)}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Created By</span>
                          <p className="font-medium truncate">{selectedBranding.createdBy ? userMap[selectedBranding.createdBy]?.displayName ?? '—' : '—'}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Updated By</span>
                          <p className="font-medium truncate">{selectedBranding.updatedBy ? userMap[selectedBranding.updatedBy]?.displayName ?? '—' : '—'}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete email branding?"
        description="This action cannot be undone. This will permanently delete this branding configuration."
        confirmationText="Delete"
        confirmationTextVariant="destructive"
        showInput={false}
      />
    </>
  )
}
