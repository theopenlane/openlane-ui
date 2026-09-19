import { BookOpenCheck, Fingerprint, ListChecks, ShieldAlert, SquarePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useSession } from 'next-auth/react'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import DashboardActionsBar, { type TDashboardAction } from './DashboardActionsBar'

type ComplianceAction = TDashboardAction & { objectType?: ObjectTypes }

const DashboardComplianceActions = () => {
  const router = useRouter()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canCreateRisk = hasPermission(orgPermission?.roles, AccessEnum.CanCreateRisk, session)
  const { hasObjectType } = useModuleAccess()

  const actions: ComplianceAction[] = [
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
      objectType: ObjectTypes.INTERNAL_POLICY,
    },
    {
      key: 'evidence',
      label: 'Add evidence',
      icon: <Fingerprint size={14} className="text-success" />,
      onClick: () => router.push('/evidence'),
      objectType: ObjectTypes.EVIDENCE,
    },
    {
      key: 'risk',
      label: canCreateRisk ? 'Log new risk' : 'View exposure',
      icon: canCreateRisk ? <SquarePlus size={14} className="text-danger" /> : <ShieldAlert size={14} className="text-danger" />,
      onClick: () => router.push(canCreateRisk ? '/exposure/risks/create' : '/exposure'),
      objectType: canCreateRisk ? ObjectTypes.RISK : ObjectTypes.FINDING,
    },
  ].filter((action) => !action.objectType || hasObjectType(action.objectType))

  return <DashboardActionsBar actions={actions} />
}

export default DashboardComplianceActions
