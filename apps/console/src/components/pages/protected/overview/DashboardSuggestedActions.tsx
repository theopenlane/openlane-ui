import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Lock, ArrowUpFromLine, UserRoundPlus } from 'lucide-react'
import CreatePolicyUploadDialog from '@/components/pages/protected/policies/create/form/create-policy-upload-dialog.tsx'
import React from 'react'
import { useRouter } from 'next/navigation'

const DashboardSuggestedActions = () => {
  const router = useRouter()

  const handleSecureOrganization = () => {
    router.push('/organization-settings/authentication')
  }

  const handleViewMembers = () => {
    router.push('/user-management/members')
  }

  const hoverClasses = 'transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:border-primary'
  const baseClasses = 'bg-homepage-card-item-transparent border border-homepage-card-border rounded-lg p-4 flex gap-4 items-start'

  return (
    <Card className="bg-homepage-card border-homepage-card-border">
      <CardTitle className="px-6 pt-6 text-lg font-semibold">
        <p>Suggested Actions</p>
        <p className="leading-5 text-sm text-muted-foreground font-normal pt-1">Keep your organization audit-ready with these recommended actions.</p>
      </CardTitle>

      <CardContent className="px-6 pb-6 pt-1">
        <div className="space-y-4">
          <CreatePolicyUploadDialog
            trigger={
              <div className={`${baseClasses} ${hoverClasses}`}>
                <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
                  <ArrowUpFromLine className="text-homepage-action-icon" size={18} />
                </div>
                <div>
                  <p className="font-medium text-sm">Import your policies & procedures</p>
                  <p className="text-xs text-muted-foreground">Already have docs? Upload them here instead of starting from scratch.</p>
                </div>
              </div>
            }
          />

          <div className={`${baseClasses} ${hoverClasses}`} onClick={handleViewMembers}>
            <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
              <UserRoundPlus className="text-homepage-action-icon" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Invite your team</p>
              <p className="text-xs text-muted-foreground">Add teammates so they can collaborate on controls, policies, and evidence.</p>
            </div>
          </div>

          <div className={`${baseClasses} ${hoverClasses}`} onClick={handleSecureOrganization}>
            <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
              <Lock className="text-homepage-action-icon" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Secure your organization</p>
              <p className="text-xs text-muted-foreground">Set up SSO, allowed domains, and permissions to keep your org safe.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardSuggestedActions
