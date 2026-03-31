import { useFormContext } from 'react-hook-form'
import { type BrandFormValues } from '../brand-schema'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { RenderBrandField } from '../../shared/render-field'
import { type TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import SectionWarning from '../section-warning'

interface BrandingCompanyInfoSectionProps {
  isReadOnly: boolean
  setting: TrustCenterSetting
  hasWarning?: boolean
}

export const BrandingCompanyInfoSection = ({ isReadOnly, setting, hasWarning }: BrandingCompanyInfoSectionProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<BrandFormValues>()

  return (
    <Card>
      <CardContent>
        {hasWarning && <SectionWarning />}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium">Company Info</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">Name</p>
              <p className="text-sm text-inverted-muted-foreground">The company name displayed on your trust center.</p>
            </div>
            <RenderBrandField name="companyName" label="Company Name" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />

            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">Company Domain</p>
              <p className="text-sm text-inverted-muted-foreground">Your primary website domain. Used for links from the trust center back to your site.</p>
            </div>
            <RenderBrandField name="companyDomain" label="https://example.com" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />

            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">Description</p>
              <p className="text-sm text-inverted-muted-foreground">A short description of your company and what you do.</p>
            </div>
            <RenderBrandField name="companyDescription" label="Briefly describe your company" component="textarea" isReadOnly={isReadOnly} setting={setting} register={register} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">Security Email Address</p>
              <p className="text-sm text-inverted-muted-foreground">Public contact email for responsible disclosure of security vulnerabilities</p>
            </div>
            <RenderBrandField name="securityContact" label="security@company.com" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />
            {!isReadOnly && errors.securityContact && <p className="text-xs text-red-500">{errors.securityContact.message}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">Status Page URL</p>
              <p className="text-sm text-inverted-muted-foreground">Optional link to your public status page</p>
            </div>
            <RenderBrandField name="statusPageURL" label="https://status.example.com" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
