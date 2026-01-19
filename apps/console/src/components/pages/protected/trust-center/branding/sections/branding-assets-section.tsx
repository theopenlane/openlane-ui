import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { AssetGroupConfig, AssetInputGroup } from './asset-input-group'

interface BrandingAssetsSectionProps {
  logo: AssetGroupConfig
  favicon: AssetGroupConfig
  isReadOnly: boolean
  hasWarning?: boolean
  normalizeUrl: (url?: string | null) => string | null
}

export const BrandingAssetsSection = ({ logo, favicon, isReadOnly, hasWarning, normalizeUrl }: BrandingAssetsSectionProps) => {
  return (
    <Card>
      <CardContent>
        {hasWarning && <SectionWarning />}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium leading-6">Brand</p>
            <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
              Upload your logo and favicon to brand your Trust Center. These assets appear in the header, browser tab, and when sharing your Trust Center externally.
            </p>
          </div>

          {/* Logo Podsekcija */}
          <AssetInputGroup
            label="Logo"
            preview={logo.preview}
            link={logo.link}
            setLink={logo.setLink}
            onUpload={logo.onUpload}
            inputType={logo.inputType}
            setInputType={logo.setInputType}
            isReadOnly={isReadOnly}
            normalizeUrl={normalizeUrl}
            fileConfigs={{
              types: ['image/jpeg', 'image/png', 'image/svg+xml'],
              shortTypes: ['PNG', 'JPG', 'SVG'],
              maxSize: 5,
            }}
          />

          <div className="border-b my-2" />

          {/* Favicon Podsekcija */}
          <AssetInputGroup
            label="Favicon"
            preview={favicon.preview}
            link={favicon.link}
            setLink={favicon.setLink}
            onUpload={favicon.onUpload}
            inputType={favicon.inputType}
            setInputType={favicon.setInputType}
            isReadOnly={isReadOnly}
            normalizeUrl={normalizeUrl}
            fileConfigs={{
              types: ['image/x-icon', 'image/png', 'image/jpeg', 'image/vnd.microsoft.icon'],
              shortTypes: ['ICO', 'PNG', 'JPG'],
              maxSize: 1,
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
