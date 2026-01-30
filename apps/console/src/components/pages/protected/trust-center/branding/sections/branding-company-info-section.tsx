import { useFormContext } from 'react-hook-form'
import { BrandFormValues } from '../brand-schema'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { RenderBrandField } from '../../shared/render-field'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
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
            <p className="text-base font-medium">Trust Center Title</p>
            <RenderBrandField name="title" label="Trust Center Title" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base font-medium">Name</p>
            <RenderBrandField name="companyName" label="Company Name" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />

            <p className="text-base font-medium">Company Domain</p>
            <RenderBrandField name="companyDomain" label="https://example.com" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />

            <p className="text-base font-medium">Description</p>
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
        </div>
      </CardContent>
    </Card>
  )
}
