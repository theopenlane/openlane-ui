import React from 'react'
import { BookOpenCheck, FileText, Fingerprint, Headset, ListChecks, ShieldAlert, SquarePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useSession } from 'next-auth/react'
import { SUPPORT_URL } from '@/constants'
import { DOCS_URL } from '@/constants/docs.ts'

type DashboardAction = {
  key: string
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

const DashboardActions = () => {
  const router = useRouter()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canCreateRisk = hasPermission(orgPermission?.roles, AccessEnum.CanCreateRisk, session)

  const actions: DashboardAction[] = [
    {
      key: 'tasks',
      label: 'View my tasks',
      icon: <ListChecks size={14} className="text-info" />,
      onClick: () => router.push('/automation/tasks?showMyTasks=true'),
    },
    {
      key: 'policies',
      label: 'Review policies',
      icon: <BookOpenCheck size={14} className="text-warning" />,
      onClick: () => router.push('/policies'),
    },
    {
      key: 'evidence',
      label: 'Add evidence',
      icon: <Fingerprint size={14} className="text-success" />,
      onClick: () => router.push('/evidence'),
    },
    {
      key: 'risk',
      label: canCreateRisk ? 'Log new risk' : 'View exposure',
      icon: canCreateRisk ? <SquarePlus size={14} className="text-danger" /> : <ShieldAlert size={14} className="text-danger" />,
      onClick: () => router.push(canCreateRisk ? '/exposure/risks/create' : '/exposure'),
    },
    {
      key: 'docs',
      label: 'View docs',
      icon: <FileText size={14} className="text-muted-foreground" />,
      href: DOCS_URL,
    },
    {
      key: 'support',
      label: 'Contact us',
      icon: <Headset size={14} className="text-muted-foreground" />,
      href: SUPPORT_URL,
    },
  ]

  const actionClassName = 'flex items-center gap-1.5 text-text-paragraph hover:text-muted-foreground transition-colors'

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-muted-foreground">Quick actions</span>
      {actions.map((action) => (
        <React.Fragment key={action.key}>
          <span className="text-border">|</span>
          {action.href ? (
            <a href={action.href} target="_blank" rel="noreferrer" aria-label={action.label} className={actionClassName}>
              {action.icon}
              {action.label}
            </a>
          ) : (
            <button type="button" onClick={action.onClick} className={actionClassName}>
              {action.icon}
              {action.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default DashboardActions
