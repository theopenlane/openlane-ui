import { ChartLine, Megaphone, PenTool, Server } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { canEdit } from '@/lib/authz/utils'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import DashboardActionsBar, { type TDashboardAction } from './DashboardActionsBar'

const DashboardTrustCenterActions = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { trustCenter } = useGetTrustCenter()
  const { data: tcPermission } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenter?.id)
  const canEditTrustCenter = canEdit(tcPermission?.roles, session)

  const actions: TDashboardAction[] = [
    {
      key: 'analytics',
      label: 'View analytics',
      icon: <ChartLine size={14} className="text-info" />,
      onClick: () => router.push('/trust-center/analytics'),
    },
    {
      key: 'nda-approvals',
      label: 'NDA approvals',
      icon: <PenTool size={14} className="text-warning" />,
      onClick: () => router.push('/trust-center/NDAs'),
    },
    {
      key: 'posts',
      label: canEditTrustCenter ? 'Create a post' : 'View posts',
      icon: <Megaphone size={14} className="text-success" />,
      onClick: () => router.push('/trust-center/updates'),
    },
    {
      key: 'subprocessors',
      label: canEditTrustCenter ? 'Update subprocessors' : 'View subprocessors',
      icon: <Server size={14} className="text-danger" />,
      onClick: () => router.push('/trust-center/subprocessors'),
    },
  ]

  return <DashboardActionsBar actions={actions} />
}

export default DashboardTrustCenterActions
