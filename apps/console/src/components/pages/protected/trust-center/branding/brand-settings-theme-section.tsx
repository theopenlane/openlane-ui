import { ColorInput } from '@/components/shared/color-input/color-input'
import { TrustCenterWatermarkConfigFontMapper, TrustCenterWatermarkConfigFontOptions } from '@/components/shared/enum-mapper/trust-center-enum'
import { TrustCenterSettingTrustCenterThemeMode, TrustCenterWatermarkConfigFont } from '@repo/codegen/src/schema'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'

type BrandSettingsThemewSectionProps = {
  selectedThemeType: TrustCenterSettingTrustCenterThemeMode
  setSelectedThemeType: React.Dispatch<React.SetStateAction<TrustCenterSettingTrustCenterThemeMode>>
  easyColor: string
  setEasyColor: React.Dispatch<React.SetStateAction<string>>
  font: string
  setFont: React.Dispatch<React.SetStateAction<string>>
  foreground: string
  setForeground: React.Dispatch<React.SetStateAction<string>>
  background: string
  setBackground: React.Dispatch<React.SetStateAction<string>>
  accent: string
  setAccent: React.Dispatch<React.SetStateAction<string>>
  secondaryForeground: string
  setSecondaryForeground: React.Dispatch<React.SetStateAction<string>>
  secondaryBackground: string
  setSecondaryBackground: React.Dispatch<React.SetStateAction<string>>
}

export const BrandSettingsThemewSection = (props: BrandSettingsThemewSectionProps) => {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium leading-6">Theme</p>
            <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
              Control the visual appearance of your Trust Center. Choose Easy Mode to apply your brand color automatically, or use Advanced Mode to customize fonts, colors, and other design settings.
            </p>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={TrustCenterSettingTrustCenterThemeMode.EASY}
                checked={props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY}
                onChange={() => props.setSelectedThemeType(TrustCenterSettingTrustCenterThemeMode.EASY)}
                className="sr-only"
              />
              <div
                className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY ? 'border-5 border-primary' : ''}`}
              >
                {props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
              </div>
              <p>Easy</p>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={TrustCenterSettingTrustCenterThemeMode.ADVANCED}
                checked={props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED}
                onChange={() => props.setSelectedThemeType(TrustCenterSettingTrustCenterThemeMode.ADVANCED)}
                className="sr-only"
              />
              <div
                className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED ? 'border-5 border-primary' : ''}`}
              >
                {props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
              </div>
              <p>Advanced</p>
            </label>
          </div>
          {props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY && (
            <div className="flex flex-col gap-3">
              <div className="w-[200px]">
                <ColorInput label="" value={props.easyColor} onChange={props.setEasyColor} />
              </div>
              <div>
                <p className="text-sm text-text-informational">Put your primary brand color and we&apos;ll take care of the rest.</p>
              </div>
            </div>
          )}
          {props.selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Font family</Label>
                <Select defaultValue={props.font} onValueChange={props.setFont}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {TrustCenterWatermarkConfigFontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {TrustCenterWatermarkConfigFontMapper[font.value as TrustCenterWatermarkConfigFont]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ColorInput label="Foreground color" value={props.foreground} onChange={props.setForeground} />
              <ColorInput label="Background color" value={props.background} onChange={props.setBackground} />
              <ColorInput label="Accent/brand color" value={props.accent} onChange={props.setAccent} />
              <ColorInput label="Secondary Foreground color" value={props.secondaryForeground} onChange={props.setSecondaryForeground} />
              <ColorInput label="Secondary Background color" value={props.secondaryBackground} onChange={props.setSecondaryBackground} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
