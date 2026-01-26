export type TAccessRole =
  | 'can_create_standard'
  | 'can_create_evidence'
  | 'can_create_control'
  | 'can_create_narrative'
  | 'can_create_risk'
  | 'can_create_procedure'
  | 'can_create_group'
  | 'can_create_control_objective'
  | 'can_delete'
  | 'can_create_template'
  | 'can_invite_members'
  | 'can_create_subcontrol'
  | 'can_create_internal_policy'
  | 'audit_log_viewer'
  | 'can_create_program'
  | 'can_create_control_implementation'
  | 'can_view'
  | 'can_edit'
  | 'member'
  | 'owner'
  | 'access'
  | 'can_invite_admins'
  | 'can_create_job_template'
  | 'can_manage_groups'
  | 'can_create_scheduled_job'
  | 'can_create_mapped_control'
  | 'can_create_trust_center_doc'

export type TData = {
  success?: boolean
  organization_id?: string
  roles: TAccessRole[]
}
