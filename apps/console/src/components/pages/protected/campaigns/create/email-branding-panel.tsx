'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { SaveIcon, X } from 'lucide-react'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
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
  const [fontFamily, setFontFamily] = useState<EmailBrandingFont>(EmailBrandingFont.HELVETICA)
  const [foregroundColor, setForegroundColor] = useState('#7391FF')
  const [backgroundColor, setBackgroundColor] = useState('#7391FF')
  const [accentColor, setAccentColor] = useState('#7391FF')
  const [secondaryForegroundColor, setSecondaryForegroundColor] = useState('#7391FF')
  const [secondaryBackgroundColor, setSecondaryBackgroundColor] = useState('#7391FF')

  const { mutateAsync: createBranding, isPending } = useCreateEmailBranding()
  const { successNotification, errorNotification } = useNotification()

  const handleSave = async () => {
    try {
      const result = await createBranding({
        input: {
          name: `Campaign Branding ${Date.now()}`,
          fontFamily,
          textColor: foregroundColor,
          backgroundColor,
          primaryColor: accentColor,
          secondaryColor: secondaryForegroundColor,
          buttonColor: secondaryBackgroundColor,
        },
      })

      const brandingId = result?.createEmailBranding?.emailBranding?.id
      if (brandingId) {
        successNotification({ title: 'Email branding saved' })
        onSave(brandingId)
      }
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col"
        minWidth="40vw"
        initialWidth="50vw"
        header={
          <SheetHeader>
            <SheetTitle className="sr-only">Email Branding</SheetTitle>
            <div className="flex flex-col gap-3">
              <div className="text-sm text-muted-foreground">Campaign Template / Email Branding</div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Email Branding</h2>
                <button type="button" onClick={onClose} className="cursor-pointer mr-6">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <CancelButton onClick={onClose} disabled={isPending} />
                <Button variant="primary" onClick={handleSave} disabled={isPending} icon={<SaveIcon size={16} />} iconPosition="left">
                  {isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </SheetHeader>
        }
      >
        <div className="flex flex-col gap-6 mt-2">
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

          <div className="grid grid-cols-2 gap-4">
            <ColorInput label="Foreground Color" value={foregroundColor} onChange={setForegroundColor} />
            <ColorInput label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorInput label="Accent/Brand Color" value={accentColor} onChange={setAccentColor} />
            <ColorInput label="Secondary Foreground Color" value={secondaryForegroundColor} onChange={setSecondaryForegroundColor} />
          </div>

          <div className="w-1/2">
            <ColorInput label="Secondary Background Color" value={secondaryBackgroundColor} onChange={setSecondaryBackgroundColor} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
