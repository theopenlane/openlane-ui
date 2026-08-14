import { BookOpenCheck, Fingerprint, ListChecks, ShieldAlert, SquarePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useSession } from 'next-auth/react'
import DashboardActionsBar, { type TDashboardAction } from './DashboardActionsBar'

const DashboardComplianceActions = () => {
  const router = useRouter()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canCreateRisk = hasPermission(orgPermission?.roles, AccessEnum.CanCreateRisk, session)

  const actions: TDashboardAction[] = [
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
  ]

  return <DashboardActionsBar actions={actions} />
}

export default DashboardComplianceActions
