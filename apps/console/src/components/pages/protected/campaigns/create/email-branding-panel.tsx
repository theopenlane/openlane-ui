'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Switch } from '@repo/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, SaveIcon, X } from 'lucide-react'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useCreateEmailBranding } from '@/lib/graphql-hooks/email-branding'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailBrandingFont } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

interface EmailBrandingPanelProps {
  open: boolean
  onClose: () => void
  onSave: (emailBrandingId: string) => void
}

const FONT_OPTIONS = Object.values(EmailBrandingFont).map((value) => ({
  label: getEnumLabel(value),
  value,
}))

export const EmailBrandingPanel: React.FC<EmailBrandingPanelProps> = ({ open, onClose, onSave }) => {
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

  const { mutateAsync: createBranding, isPending } = useCreateEmailBranding()
  const { successNotification, errorNotification } = useNotification()

  const resetForm = () => {
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

  const handleClose = () => {
    resetForm()
    onClose()
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

    try {
      const result = await createBranding({
        input: {
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
        },
      })

      const brandingId = result?.createEmailBranding?.emailBranding?.id
      if (brandingId) {
        successNotification({ title: 'Email branding created' })
        resetForm()
        onSave(brandingId)
      }
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        className="flex flex-col"
        minWidth="40vw"
        initialWidth="50vw"
        header={
          <SheetHeader>
            <SheetTitle className="sr-only">Email Branding</SheetTitle>
            <div className="flex flex-col gap-3">
              <div className="text-sm text-muted-foreground">
                Campaign Template / <span className="font-semibold text-foreground">Create Branding</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleClose} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={isPending || !name.trim()} icon={<SaveIcon size={16} />} iconPosition="left">
                    {isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <button type="button" onClick={handleClose} className="cursor-pointer mr-6">
                  <X size={16} />
                </button>
              </div>
            </div>
          </SheetHeader>
        }
      >
        <div className="flex flex-col gap-6 mt-2">
          {/* Default Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <span className="text-sm font-semibold">Set as Default</span>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>

          <Accordion type="multiple" defaultValue={['basic', 'theme']} className="flex flex-col gap-6">
            {/* Basic Section */}
            <AccordionItem value="basic" className="rounded-lg border border-border bg-card overflow-hidden">
              <AccordionTrigger asChild>
                <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                  <span className="text-sm font-semibold">Basic</span>
                  <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">
                        Name<span className="text-destructive">*</span>
                      </label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Corporate Branding" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Brand Name</label>
                      <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Openlane" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input value={logoRemoteURL} onChange={(e) => setLogoRemoteURL(e.target.value)} placeholder="https://example.com/logo.png" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Theme Section */}
            <AccordionItem value="theme" className="rounded-lg border border-border bg-card overflow-hidden">
              <AccordionTrigger asChild>
                <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                  <span className="text-sm font-semibold">Theme</span>
                  <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="border-t border-border px-4 py-4 flex flex-col gap-6">

                  {/* Text */}
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

                  {/* Card */}
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold text-muted-foreground">Card</span>
                    <div className="grid grid-cols-3 gap-4">
                      <ColorInput label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
                      <ColorInput label="Foreground Color" value={primaryColor} onChange={setPrimaryColor} />
                    </div>
                  </div>

                  {/* Button */}
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
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  )
}
