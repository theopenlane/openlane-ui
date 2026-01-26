'use client'

import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { TrustCenterWatermarkConfigFontOptions } from '@/components/shared/enum-mapper/trust-center-enum'
import { useFormContext } from 'react-hook-form'
import { BrandFormValues } from '../brand-schema'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'

interface BrandingThemeSectionProps {
  isReadOnly: boolean
  setting: TrustCenterSetting
  hasWarning?: boolean
}

export const BrandingThemeSection = ({ isReadOnly, hasWarning, setting }: BrandingThemeSectionProps) => {
  const { watch, setValue } = useFormContext<BrandFormValues>()

  const themeMode = watch('themeMode')
  const font = watch('font')
  const primaryColor = watch('primaryColor')
  const foregroundColor = watch('foregroundColor')
  const backgroundColor = watch('backgroundColor')
  const accentColor = watch('accentColor')
  const secondaryForegroundColor = watch('secondaryForegroundColor')
  const secondaryBackgroundColor = watch('secondaryBackgroundColor')

  const handleUpdate = (field: keyof BrandFormValues, value: string | TrustCenterSettingTrustCenterThemeMode) => {
    setValue(field, value as string, { shouldDirty: true })
  }

  const ReadOnlyColor = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col gap-1.5 py-1">
      <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: value || 'transparent' }} />
        <p className="text-sm font-mono">{value || 'N/A'}</p>
      </div>
    </div>
  )

  const currentThemeMode = isReadOnly ? setting?.themeMode : themeMode

  return (
    <Card>
      <CardContent>
        {hasWarning && <SectionWarning />}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium">Theme</p>
            <p className="text-sm text-inverted-muted-foreground">Control the visual appearance of your Trust Center.</p>
          </div>

          <div className="flex gap-6">
            {[TrustCenterSettingTrustCenterThemeMode.EASY, TrustCenterSettingTrustCenterThemeMode.ADVANCED].map((mode) => (
              <label key={mode} className={`flex items-center gap-1 ${isReadOnly ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
                <input type="radio" className="sr-only" checked={currentThemeMode === mode} onChange={() => !isReadOnly && handleUpdate('themeMode', mode)} disabled={isReadOnly} />
                <div className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${currentThemeMode === mode ? 'border-primary' : 'border-border'}`}>
                  {currentThemeMode === mode && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm font-medium">{mode === TrustCenterSettingTrustCenterThemeMode.EASY ? 'Easy' : 'Advanced'}</p>
              </label>
            ))}
          </div>

          {currentThemeMode === TrustCenterSettingTrustCenterThemeMode.EASY ? (
            <div className="flex flex-col gap-3">
              {isReadOnly ? (
                <ReadOnlyColor label="Primary Color" value={setting?.primaryColor} />
              ) : (
                <>
                  <div className="w-[200px]">
                    <ColorInput label="" value={primaryColor} onChange={(v) => handleUpdate('primaryColor', v)} disabled={isReadOnly} />
                  </div>
                  <p className="text-sm text-text-informational">Put your primary brand color and we&apos;ll take care of the rest.</p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-sm">Font family</Label>
                {isReadOnly ? (
                  <p className="text-sm font-medium">{TrustCenterWatermarkConfigFontOptions.find((f) => f.value === setting?.font)?.label || setting?.font || 'Default'}</p>
                ) : (
                  <Select value={font} onValueChange={(v) => handleUpdate('font', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TrustCenterWatermarkConfigFontOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {isReadOnly ? (
                <>
                  <ReadOnlyColor label="Foreground" value={setting?.foregroundColor} />
                  <ReadOnlyColor label="Background" value={setting?.backgroundColor} />
                  <ReadOnlyColor label="Accent" value={setting?.accentColor} />
                  <ReadOnlyColor label="Sec. Foreground" value={setting?.secondaryForegroundColor} />
                  <ReadOnlyColor label="Sec. Background" value={setting?.secondaryBackgroundColor} />
                </>
              ) : (
                <>
                  <ColorInput label="Foreground" value={foregroundColor} onChange={(v) => handleUpdate('foregroundColor', v)} />
                  <ColorInput label="Background" value={backgroundColor} onChange={(v) => handleUpdate('backgroundColor', v)} />
                  <ColorInput label="Accent" value={accentColor} onChange={(v) => handleUpdate('accentColor', v)} />
                  <ColorInput label="Sec. Foreground" value={secondaryForegroundColor} onChange={(v) => handleUpdate('secondaryForegroundColor', v)} />
                  <ColorInput label="Sec. Background" value={secondaryBackgroundColor} onChange={(v) => handleUpdate('secondaryBackgroundColor', v)} />
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
