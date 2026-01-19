import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { TrustCenterWatermarkConfigFontOptions } from '@/components/shared/enum-mapper/trust-center-enum'

interface BrandingThemeSectionProps {
  selectedThemeType: TrustCenterSettingTrustCenterThemeMode
  setSelectedThemeType: (mode: TrustCenterSettingTrustCenterThemeMode) => void
  font: string
  setFont: (font: string) => void
  colors: {
    easyColor: string
    setEasyColor: (color: string) => void
    foreground: string
    setForeground: (color: string) => void
    background: string
    setBackground: (color: string) => void
    accent: string
    setAccent: (color: string) => void
    secondaryForeground: string
    setSecondaryForeground: (color: string) => void
    secondaryBackground: string
    setSecondaryBackground: (color: string) => void
  }
  isReadOnly: boolean
  hasWarning?: boolean
}

export const BrandingThemeSection = ({ selectedThemeType, setSelectedThemeType, font, setFont, colors, isReadOnly, hasWarning }: BrandingThemeSectionProps) => (
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
            <label key={mode} className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
              <input type="radio" className="sr-only" checked={selectedThemeType === mode} onChange={() => setSelectedThemeType(mode)} disabled={isReadOnly} />
              <div className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedThemeType === mode ? 'border-primary' : ''}`}>
                {selectedThemeType === mode && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
              </div>
              <p>{mode === 'EASY' ? 'Easy' : 'Advanced'}</p>
            </label>
          ))}
        </div>

        {selectedThemeType === 'EASY' ? (
          <div className="flex flex-col gap-3">
            <div className="w-[200px]">
              <ColorInput label="" value={colors.easyColor} onChange={colors.setEasyColor} disabled={isReadOnly} />
            </div>
            <p className="text-sm text-text-informational">Put your primary brand color and we&apos;ll take care of the rest.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Font family</Label>
              <Select value={font} onValueChange={setFont} disabled={isReadOnly}>
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
            </div>
            <ColorInput label="Foreground" value={colors.foreground} onChange={colors.setForeground} disabled={isReadOnly} />
            <ColorInput label="Background" value={colors.background} onChange={colors.setBackground} disabled={isReadOnly} />
            <ColorInput label="Accent" value={colors.accent} onChange={colors.setAccent} disabled={isReadOnly} />
            <ColorInput label="Sec. Foreground" value={colors.secondaryForeground} onChange={colors.setSecondaryForeground} disabled={isReadOnly} />
            <ColorInput label="Sec. Background" value={colors.secondaryBackground} onChange={colors.setSecondaryBackground} disabled={isReadOnly} />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)
