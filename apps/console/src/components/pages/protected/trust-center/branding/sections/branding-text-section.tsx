import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'

interface BrandingTextSectionProps {
  title: string
  setTitle: (val: string) => void
  overview: string
  setOverview: (val: string) => void
  securityContact: string
  setSecurityContact: (val: string) => void
  isReadOnly: boolean
  hasWarning?: boolean
}

export const BrandingTextSection = ({ title, setTitle, overview, setOverview, securityContact, setSecurityContact, isReadOnly, hasWarning }: BrandingTextSectionProps) => (
  <Card>
    <CardContent>
      {hasWarning && <SectionWarning />}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium">Title and Overview</p>
          <p className="text-sm text-inverted-muted-foreground">This information appears prominently at the top of your Trust Center and is used for SEO.</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-base font-medium">Title</p>
          <Input value={title} disabled={isReadOnly} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-base font-medium">Overview</p>
          <Textarea value={overview} disabled={isReadOnly} onChange={(e) => setOverview(e.target.value)} placeholder="Enter overview" rows={5} />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium">Security Email Address</p>
            <p className="text-sm text-inverted-muted-foreground">Public contact email for responsible disclosure of security vulnerabilities</p>
          </div>
          <Input type="email" value={securityContact} disabled={isReadOnly} onChange={(e) => setSecurityContact(e.target.value)} placeholder="security@yourcompany.com" />
        </div>
      </div>
    </CardContent>
  </Card>
)
