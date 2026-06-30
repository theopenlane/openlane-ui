import { TriangleAlert } from 'lucide-react'

export const SuperAdminRoleWarning = () => (
  <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
    <TriangleAlert className="mt-0.5 shrink-0 text-warning" width={16} height={16} />
    <span>
      Super Admin grants full access to the organization. Consider assigning <b>Admin</b> or <b>Member</b> with specific functional roles instead, to follow least privilege.
    </span>
  </div>
)
