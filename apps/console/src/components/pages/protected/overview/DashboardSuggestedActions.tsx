import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Upload, Users, Lock } from 'lucide-react'

const DashboardSuggestedActions = () => {
  return (
    <Card className="bg-homepage-card border-homepage-card-border">
      <CardTitle className="px-6 pt-6 text-lg font-semibold">
        <p>Suggested Actions</p>
        <p className="leading-5 text-sm text-muted-foreground font-normal pt-1">Keep your organization audit-ready with these recommended actions.</p>
      </CardTitle>

      <CardContent className="px-6 pb-6 pt-1">
        <div className="space-y-4">
          <div className="bg-homepage-card-item border border-homepage-card-border rounded-lg p-4 flex gap-4 items-center">
            <div className="p-2 rounded-md bg-info/10">
              <Upload className="text-info" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Import your policies & procedures</p>
              <p className="text-xs text-muted-foreground">Already have docs? Upload them here instead of starting from scratch.</p>
            </div>
          </div>

          <div className="bg-homepage-card-item border border-homepage-card-border rounded-lg p-4 flex gap-4 items-center">
            <div className="p-2 rounded-md bg-success/10">
              <Users className="text-success" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Invite your team</p>
              <p className="text-xs text-muted-foreground">Add teammates so they can collaborate on controls, policies, and evidence.</p>
            </div>
          </div>

          <div className="bg-homepage-card-item border border-homepage-card-border rounded-lg p-4 flex gap-4 items-center">
            <div className="p-2 rounded-md bg-warning/10">
              <Lock className="text-warning" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Secure your account</p>
              <p className="text-xs text-muted-foreground">Set up SSO, 2FA, and permissions to keep your org safe.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardSuggestedActions
