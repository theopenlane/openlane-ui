'use client'

import React, { useState } from 'react'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { ColorInput } from '@/components/shared/color-input/color-input'

type Props = {
  setting: TrustCenterSetting
}

const ThemeSection = ({ setting }: Props) => {
  const [easyColor, setEasyColor] = useState(setting?.primaryColor ?? '#f0f0e0')
  const [foreground, setForeground] = useState(setting?.foregroundColor ?? '#f0f0e0')
  const [background, setBackground] = useState(setting?.backgroundColor ?? '#f0f0e0')
  const [secondaryForeground, setSecondaryForeground] = useState(setting?.secondaryForegroundColor ?? '#f0f0e0')
  const [secondaryBackground, setSecondaryBackground] = useState(setting?.secondaryBackgroundColor ?? '#f0f0e0')
  const [accent, setAccent] = useState(setting?.accentColor ?? '#f0f0e0')
  const [font, setFont] = useState(setting?.font ?? 'outfit')
  const [themeMode, setThemeMode] = useState<TrustCenterSettingTrustCenterThemeMode>(setting?.themeMode ?? TrustCenterSettingTrustCenterThemeMode.EASY)

  const { updateTrustCenterSetting, isPending } = useHandleUpdateSetting()

  const isDirty =
    easyColor !== (setting?.primaryColor ?? '#f0f0e0') ||
    foreground !== (setting?.foregroundColor ?? '#f0f0e0') ||
    background !== (setting?.backgroundColor ?? '#f0f0e0') ||
    secondaryForeground !== (setting?.secondaryForegroundColor ?? '#f0f0e0') ||
    secondaryBackground !== (setting?.secondaryBackgroundColor ?? '#f0f0e0') ||
    accent !== (setting?.accentColor ?? '#f0f0e0') ||
    font !== (setting?.font ?? 'outfit') ||
    themeMode !== (setting?.themeMode ?? TrustCenterSettingTrustCenterThemeMode.EASY)

  const handleSave = async () => {
    await updateTrustCenterSetting({
      id: setting?.id,
      input: {
        primaryColor: easyColor,
        foregroundColor: foreground,
        backgroundColor: background,
        secondaryForegroundColor: secondaryForeground,
        secondaryBackgroundColor: secondaryBackground,
        accentColor: accent,
        font,
        themeMode,
      },
    })
  }

  return (
    <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
      <h1 className="text-xl text-text-header font-medium">Theme</h1>
      <div className="space-y-6">
        <RadioGroup value={themeMode} onValueChange={(val) => setThemeMode(val as TrustCenterSettingTrustCenterThemeMode)} className="space-y-6">
          <div className="flex items-start gap-3">
            <RadioGroupItem value={TrustCenterSettingTrustCenterThemeMode.EASY} id="easy" className="mt-1" />
            <div className="space-y-2">
              <Label htmlFor="easy" className="font-medium">
                Easy mode
              </Label>
              <ColorInput label="" value={easyColor} onChange={setEasyColor} />
              <p className="text-sm text-text-informational">Put your primary brand color and we&apos;ll take care of the rest.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RadioGroupItem value={TrustCenterSettingTrustCenterThemeMode.ADVANCED} id="advanced" className="mt-1" />
            <div className="space-y-4">
              <Label htmlFor="advanced" className="font-medium">
                Advanced mode
              </Label>
              <div className="space-y-1">
                <Label className="text-sm">Font</Label>
                <Select defaultValue={font} onValueChange={setFont}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Default (Outfit)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outfit">Default (Outfit)</SelectItem>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ColorInput label="Foreground color" value={foreground} onChange={setForeground} />
              <ColorInput label="Background color" value={background} onChange={setBackground} />
              <ColorInput label="Accent/brand color" value={accent} onChange={setAccent} />
              <ColorInput label="Secondary Foreground color" value={secondaryForeground} onChange={setSecondaryForeground} />
              <ColorInput label="Secondary Background color" value={secondaryBackground} onChange={setSecondaryBackground} />
            </div>
          </div>
        </RadioGroup>

        <Button onClick={handleSave} disabled={isPending || !isDirty} className="ml-7" variant="secondary">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

export default ThemeSection
