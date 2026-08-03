'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { ClipboardPaste } from 'lucide-react'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { parseBrandingString } from '@/utils/brandingString'
import { useNotification } from '@/hooks/useNotification'
import { type BrandFormValues } from '../brand-schema'

export const BrandingPaletteImport = () => {
  const { setValue } = useFormContext<BrandFormValues>()
  const { successNotification } = useNotification()
  const [brandingString, setBrandingString] = useState('')
  const [error, setError] = useState('')

  const handleApply = () => {
    const colors = parseBrandingString(brandingString)

    if (!colors) {
      setError('That is not a valid branding string. Copy it from the Trust Center color generator.')
      return
    }

    setValue('themeMode', TrustCenterSettingTrustCenterThemeMode.ADVANCED, { shouldDirty: true })
    setValue('foregroundColor', colors.foregroundColor, { shouldDirty: true })
    setValue('backgroundColor', colors.backgroundColor, { shouldDirty: true })
    setValue('accentColor', colors.accentColor, { shouldDirty: true })
    setValue('secondaryForegroundColor', colors.secondaryForegroundColor, { shouldDirty: true })
    setValue('secondaryBackgroundColor', colors.secondaryBackgroundColor, { shouldDirty: true })

    setError('')
    setBrandingString('')
    successNotification({ title: 'Colors applied', description: 'Remember to Preview or Publish.' })
  }

  const handleChange = (value: string) => {
    setBrandingString(value)
    setError('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">Import palette</Label>
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 flex-1 max-w-[520px]">
          <Input
            value={brandingString}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="olbrand1:bg=#0a0d17;fg=#ffffff;accent=#05f7fe;secBg=#0d1222;secFg=#3791f7"
            className="h-8 font-mono text-xs"
            spellCheck={false}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="button" variant="secondary" icon={<ClipboardPaste size={16} />} onClick={handleApply} disabled={!brandingString.trim()}>
          Apply
        </Button>
      </div>
    </div>
  )
}
