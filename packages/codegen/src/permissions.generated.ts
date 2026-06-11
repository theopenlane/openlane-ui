/* eslint-disable */

export enum AccessEnum {
  AuditLogViewer = 'audit_log_viewer',
  CanCreateActionPlan = 'can_create_action_plan',
  CanCreateApiToken = 'can_create_api_token',
  CanCreateAssessment = 'can_create_assessment',
  CanCreateAsset = 'can_create_asset',
  CanCreateCampaign = 'can_create_campaign',
  CanCreateCampaignTarget = 'can_create_campaign_target',
  CanCreateCheckResult = 'can_create_check_result',
  CanCreateContact = 'can_create_contact',
  CanCreateControl = 'can_create_control',
  CanCreateControlImplementation = 'can_create_control_implementation',
  CanCreateControlObjective = 'can_create_control_objective',
  CanCreateCustomDomain = 'can_create_custom_domain',
  CanCreateCustomTypeEnum = 'can_create_custom_type_enum',
  CanCreateDirectoryAccount = 'can_create_directory_account',
  CanCreateDirectoryGroup = 'can_create_directory_group',
  CanCreateDirectoryMembership = 'can_create_directory_membership',
  CanCreateDirectorySyncRun = 'can_create_directory_sync_run',
  CanCreateDiscussion = 'can_create_discussion',
  CanCreateDocumentData = 'can_create_document_data',
  CanCreateEmailTemplate = 'can_create_email_template',
  CanCreateEntity = 'can_create_entity',
  CanCreateEntityType = 'can_create_entity_type',
  CanCreateEvidence = 'can_create_evidence',
  CanCreateFile = 'can_create_file',
  CanCreateFinding = 'can_create_finding',
  CanCreateFindingControl = 'can_create_finding_control',
  CanCreateGroup = 'can_create_group',
  CanCreateGroupMembership = 'can_create_group_membership',
  CanCreateGroupSetting = 'can_create_group_setting',
  CanCreateHush = 'can_create_hush',
  CanCreateIdentityHolder = 'can_create_identity_holder',
  CanCreateInternalPolicy = 'can_create_internal_policy',
  CanCreateInvite = 'can_create_invite',
  CanCreateJobRunner = 'can_create_job_runner',
  CanCreateJobRunnerRegistrationToken = 'can_create_job_runner_registration_token',
  CanCreateJobRunnerToken = 'can_create_job_runner_token',
  CanCreateJobTemplate = 'can_create_job_template',
  CanCreateMappedControl = 'can_create_mapped_control',
  CanCreateNarrative = 'can_create_narrative',
  CanCreateNote = 'can_create_note',
  CanCreateNotificationTemplate = 'can_create_notification_template',
  CanCreateOrgMembership = 'can_create_org_membership',
  CanCreatePlatform = 'can_create_platform',
  CanCreateProcedure = 'can_create_procedure',
  CanCreateProgram = 'can_create_program',
  CanCreateProgramMembership = 'can_create_program_membership',
  CanCreateRemediation = 'can_create_remediation',
  CanCreateReview = 'can_create_review',
  CanCreateRisk = 'can_create_risk',
  CanCreateScan = 'can_create_scan',
  CanCreateScheduledJob = 'can_create_scheduled_job',
  CanCreateScheduledJobRun = 'can_create_scheduled_job_run',
  CanCreateSlaDefinition = 'can_create_sla_definition',
  CanCreateStandard = 'can_create_standard',
  CanCreateSubcontrol = 'can_create_subcontrol',
  CanCreateSubprocessor = 'can_create_subprocessor',
  CanCreateSubscriber = 'can_create_subscriber',
  CanCreateSystemDetail = 'can_create_system_detail',
  CanCreateTagDefinition = 'can_create_tag_definition',
  CanCreateTask = 'can_create_task',
  CanCreateTemplate = 'can_create_template',
  CanCreateTrustCenter = 'can_create_trust_center',
  CanCreateTrustCenterCompliance = 'can_create_trust_center_compliance',
  CanCreateTrustCenterDoc = 'can_create_trust_center_doc',
  CanCreateTrustCenterEntity = 'can_create_trust_center_entity',
  CanCreateTrustCenterFaq = 'can_create_trust_center_faq',
  CanCreateTrustCenterNdaRequest = 'can_create_trust_center_nda_request',
  CanCreateTrustCenterSubprocessor = 'can_create_trust_center_subprocessor',
  CanCreateTrustCenterWatermarkConfig = 'can_create_trust_center_watermark_config',
  CanCreateVendorRiskScore = 'can_create_vendor_risk_score',
  CanCreateVendorScoringConfig = 'can_create_vendor_scoring_config',
  CanCreateVulnerability = 'can_create_vulnerability',
  CanCreateWorkflowDefinition = 'can_create_workflow_definition',
  CanDelete = 'can_delete',
  CanDeleteActionPlan = 'can_delete_action_plan',
  CanDeleteApiToken = 'can_delete_api_token',
  CanDeleteAssessment = 'can_delete_assessment',
  CanDeleteAsset = 'can_delete_asset',
  CanDeleteCampaign = 'can_delete_campaign',
  CanDeleteCampaignTarget = 'can_delete_campaign_target',
  CanDeleteCheckResult = 'can_delete_check_result',
  CanDeleteContact = 'can_delete_contact',
  CanDeleteControl = 'can_delete_control',
  CanDeleteControlImplementation = 'can_delete_control_implementation',
  CanDeleteControlObjective = 'can_delete_control_objective',
  CanDeleteCustomDomain = 'can_delete_custom_domain',
  CanDeleteCustomTypeEnum = 'can_delete_custom_type_enum',
  CanDeleteDirectoryAccount = 'can_delete_directory_account',
  CanDeleteDirectoryGroup = 'can_delete_directory_group',
  CanDeleteDirectoryMembership = 'can_delete_directory_membership',
  CanDeleteDirectorySyncRun = 'can_delete_directory_sync_run',
  CanDeleteDiscussion = 'can_delete_discussion',
  CanDeleteDocumentData = 'can_delete_document_data',
  CanDeleteEmailTemplate = 'can_delete_email_template',
  CanDeleteEntity = 'can_delete_entity',
  CanDeleteEntityType = 'can_delete_entity_type',
  CanDeleteEvidence = 'can_delete_evidence',
  CanDeleteFile = 'can_delete_file',
  CanDeleteFinding = 'can_delete_finding',
  CanDeleteFindingControl = 'can_delete_finding_control',
  CanDeleteGroup = 'can_delete_group',
  CanDeleteGroupMembership = 'can_delete_group_membership',
  CanDeleteGroupSetting = 'can_delete_group_setting',
  CanDeleteHush = 'can_delete_hush',
  CanDeleteIdentityHolder = 'can_delete_identity_holder',
  CanDeleteInternalPolicy = 'can_delete_internal_policy',
  CanDeleteInvite = 'can_delete_invite',
  CanDeleteJobRunner = 'can_delete_job_runner',
  CanDeleteJobRunnerRegistrationToken = 'can_delete_job_runner_registration_token',
  CanDeleteJobRunnerToken = 'can_delete_job_runner_token',
  CanDeleteJobTemplate = 'can_delete_job_template',
  CanDeleteMappedControl = 'can_delete_mapped_control',
  CanDeleteNarrative = 'can_delete_narrative',
  CanDeleteNote = 'can_delete_note',
  CanDeleteNotificationTemplate = 'can_delete_notification_template',
  CanDeleteOrgMembership = 'can_delete_org_membership',
  CanDeleteOrgSubscription = 'can_delete_org_subscription',
  CanDeleteOrganization = 'can_delete_organization',
  CanDeleteOrganizationSetting = 'can_delete_organization_setting',
  CanDeletePlatform = 'can_delete_platform',
  CanDeleteProcedure = 'can_delete_procedure',
  CanDeleteProgram = 'can_delete_program',
  CanDeleteProgramMembership = 'can_delete_program_membership',
  CanDeleteRemediation = 'can_delete_remediation',
  CanDeleteReview = 'can_delete_review',
  CanDeleteRisk = 'can_delete_risk',
  CanDeleteScan = 'can_delete_scan',
  CanDeleteScheduledJob = 'can_delete_scheduled_job',
  CanDeleteScheduledJobRun = 'can_delete_scheduled_job_run',
  CanDeleteSlaDefinition = 'can_delete_sla_definition',
  CanDeleteStandard = 'can_delete_standard',
  CanDeleteSubcontrol = 'can_delete_subcontrol',
  CanDeleteSubprocessor = 'can_delete_subprocessor',
  CanDeleteSubscriber = 'can_delete_subscriber',
  CanDeleteSystemDetail = 'can_delete_system_detail',
  CanDeleteTagDefinition = 'can_delete_tag_definition',
  CanDeleteTask = 'can_delete_task',
  CanDeleteTemplate = 'can_delete_template',
  CanDeleteTrustCenter = 'can_delete_trust_center',
  CanDeleteTrustCenterCompliance = 'can_delete_trust_center_compliance',
  CanDeleteTrustCenterDoc = 'can_delete_trust_center_doc',
  CanDeleteTrustCenterEntity = 'can_delete_trust_center_entity',
  CanDeleteTrustCenterFaq = 'can_delete_trust_center_faq',
  CanDeleteTrustCenterNdaRequest = 'can_delete_trust_center_nda_request',
  CanDeleteTrustCenterSetting = 'can_delete_trust_center_setting',
  CanDeleteTrustCenterSubprocessor = 'can_delete_trust_center_subprocessor',
  CanDeleteTrustCenterWatermarkConfig = 'can_delete_trust_center_watermark_config',
  CanDeleteVendorRiskScore = 'can_delete_vendor_risk_score',
  CanDeleteVendorScoringConfig = 'can_delete_vendor_scoring_config',
  CanDeleteVulnerability = 'can_delete_vulnerability',
  CanDeleteWorkflowDefinition = 'can_delete_workflow_definition',
  CanEdit = 'can_edit',
  CanEditActionPlan = 'can_edit_action_plan',
  CanEditApiToken = 'can_edit_api_token',
  CanEditAssessment = 'can_edit_assessment',
  CanEditAsset = 'can_edit_asset',
  CanEditCampaign = 'can_edit_campaign',
  CanEditCampaignTarget = 'can_edit_campaign_target',
  CanEditCheckResult = 'can_edit_check_result',
  CanEditContact = 'can_edit_contact',
  CanEditControl = 'can_edit_control',
  CanEditControlImplementation = 'can_edit_control_implementation',
  CanEditControlObjective = 'can_edit_control_objective',
  CanEditCustomDomain = 'can_edit_custom_domain',
  CanEditCustomTypeEnum = 'can_edit_custom_type_enum',
  CanEditDirectoryAccount = 'can_edit_directory_account',
  CanEditDirectoryGroup = 'can_edit_directory_group',
  CanEditDirectoryMembership = 'can_edit_directory_membership',
  CanEditDirectorySyncRun = 'can_edit_directory_sync_run',
  CanEditDiscussion = 'can_edit_discussion',
  CanEditDocumentData = 'can_edit_document_data',
  CanEditEmailTemplate = 'can_edit_email_template',
  CanEditEntity = 'can_edit_entity',
  CanEditEntityType = 'can_edit_entity_type',
  CanEditEvidence = 'can_edit_evidence',
  CanEditFile = 'can_edit_file',
  CanEditFinding = 'can_edit_finding',
  CanEditFindingControl = 'can_edit_finding_control',
  CanEditGroup = 'can_edit_group',
  CanEditGroupMembership = 'can_edit_group_membership',
  CanEditGroupSetting = 'can_edit_group_setting',
  CanEditHush = 'can_edit_hush',
  CanEditIdentityHolder = 'can_edit_identity_holder',
  CanEditInternalPolicy = 'can_edit_internal_policy',
  CanEditInvite = 'can_edit_invite',
  CanEditJobRunner = 'can_edit_job_runner',
  CanEditJobRunnerRegistrationToken = 'can_edit_job_runner_registration_token',
  CanEditJobRunnerToken = 'can_edit_job_runner_token',
  CanEditJobTemplate = 'can_edit_job_template',
  CanEditMappedControl = 'can_edit_mapped_control',
  CanEditNarrative = 'can_edit_narrative',
  CanEditNote = 'can_edit_note',
  CanEditNotificationTemplate = 'can_edit_notification_template',
  CanEditOrgMembership = 'can_edit_org_membership',
  CanEditOrgSubscription = 'can_edit_org_subscription',
  CanEditOrganization = 'can_edit_organization',
  CanEditOrganizationSetting = 'can_edit_organization_setting',
  CanEditPlatform = 'can_edit_platform',
  CanEditProcedure = 'can_edit_procedure',
  CanEditProgram = 'can_edit_program',
  CanEditProgramMembership = 'can_edit_program_membership',
  CanEditRemediation = 'can_edit_remediation',
  CanEditReview = 'can_edit_review',
  CanEditRisk = 'can_edit_risk',
  CanEditScan = 'can_edit_scan',
  CanEditScheduledJob = 'can_edit_scheduled_job',
  CanEditScheduledJobRun = 'can_edit_scheduled_job_run',
  CanEditService = 'can_edit_service',
  CanEditSlaDefinition = 'can_edit_sla_definition',
  CanEditStandard = 'can_edit_standard',
  CanEditSubcontrol = 'can_edit_subcontrol',
  CanEditSubprocessor = 'can_edit_subprocessor',
  CanEditSubscriber = 'can_edit_subscriber',
  CanEditSystemDetail = 'can_edit_system_detail',
  CanEditTagDefinition = 'can_edit_tag_definition',
  CanEditTask = 'can_edit_task',
  CanEditTemplate = 'can_edit_template',
  CanEditTrustCenter = 'can_edit_trust_center',
  CanEditTrustCenterCompliance = 'can_edit_trust_center_compliance',
  CanEditTrustCenterDoc = 'can_edit_trust_center_doc',
  CanEditTrustCenterEntity = 'can_edit_trust_center_entity',
  CanEditTrustCenterFaq = 'can_edit_trust_center_faq',
  CanEditTrustCenterNdaRequest = 'can_edit_trust_center_nda_request',
  CanEditTrustCenterSetting = 'can_edit_trust_center_setting',
  CanEditTrustCenterSubprocessor = 'can_edit_trust_center_subprocessor',
  CanEditTrustCenterWatermarkConfig = 'can_edit_trust_center_watermark_config',
  CanEditVendorRiskScore = 'can_edit_vendor_risk_score',
  CanEditVendorScoringConfig = 'can_edit_vendor_scoring_config',
  CanEditVulnerability = 'can_edit_vulnerability',
  CanEditWorkflowDefinition = 'can_edit_workflow_definition',
  CanInviteAdmins = 'can_invite_admins',
  CanInviteAuditors = 'can_invite_auditors',
  CanInviteMembers = 'can_invite_members',
  CanInviteSuperAdmins = 'can_invite_super_admins',
  CanManageCampaigns = 'can_manage_campaigns',
  CanManageCompliance = 'can_manage_compliance',
  CanManageGroup = 'can_manage_group',
  CanManagePolicies = 'can_manage_policies',
  CanManageRegistry = 'can_manage_registry',
  CanManageRisk = 'can_manage_risk',
  CanManageTrustCenter = 'can_manage_trust_center',
  CanManageWorkflows = 'can_manage_workflows',
  CanView = 'can_view',
  CanViewActionPlan = 'can_view_action_plan',
  CanViewApiToken = 'can_view_api_token',
  CanViewAssessment = 'can_view_assessment',
  CanViewAsset = 'can_view_asset',
  CanViewCampaign = 'can_view_campaign',
  CanViewCampaignTarget = 'can_view_campaign_target',
  CanViewCheckResult = 'can_view_check_result',
  CanViewContact = 'can_view_contact',
  CanViewControl = 'can_view_control',
  CanViewControlImplementation = 'can_view_control_implementation',
  CanViewControlObjective = 'can_view_control_objective',
  CanViewCustomDomain = 'can_view_custom_domain',
  CanViewCustomTypeEnum = 'can_view_custom_type_enum',
  CanViewDirectoryAccount = 'can_view_directory_account',
  CanViewDirectoryGroup = 'can_view_directory_group',
  CanViewDirectoryMembership = 'can_view_directory_membership',
  CanViewDirectorySyncRun = 'can_view_directory_sync_run',
  CanViewDiscussion = 'can_view_discussion',
  CanViewDocumentData = 'can_view_document_data',
  CanViewEmailTemplate = 'can_view_email_template',
  CanViewEntity = 'can_view_entity',
  CanViewEntityType = 'can_view_entity_type',
  CanViewEvidence = 'can_view_evidence',
  CanViewFile = 'can_view_file',
  CanViewFinding = 'can_view_finding',
  CanViewFindingControl = 'can_view_finding_control',
  CanViewGroup = 'can_view_group',
  CanViewGroupMembership = 'can_view_group_membership',
  CanViewGroupSetting = 'can_view_group_setting',
  CanViewHush = 'can_view_hush',
  CanViewIdentityHolder = 'can_view_identity_holder',
  CanViewInternalPolicy = 'can_view_internal_policy',
  CanViewInvite = 'can_view_invite',
  CanViewJobRunner = 'can_view_job_runner',
  CanViewJobRunnerRegistrationToken = 'can_view_job_runner_registration_token',
  CanViewJobRunnerToken = 'can_view_job_runner_token',
  CanViewJobTemplate = 'can_view_job_template',
  CanViewMappedControl = 'can_view_mapped_control',
  CanViewNarrative = 'can_view_narrative',
  CanViewNote = 'can_view_note',
  CanViewNotificationTemplate = 'can_view_notification_template',
  CanViewOrg = 'can_view_org',
  CanViewOrgMembership = 'can_view_org_membership',
  CanViewOrgSubscription = 'can_view_org_subscription',
  CanViewOrganization = 'can_view_organization',
  CanViewOrganizationSetting = 'can_view_organization_setting',
  CanViewPlatform = 'can_view_platform',
  CanViewProcedure = 'can_view_procedure',
  CanViewProgram = 'can_view_program',
  CanViewProgramMembership = 'can_view_program_membership',
  CanViewRemediation = 'can_view_remediation',
  CanViewReview = 'can_view_review',
  CanViewRisk = 'can_view_risk',
  CanViewScan = 'can_view_scan',
  CanViewScheduledJob = 'can_view_scheduled_job',
  CanViewScheduledJobRun = 'can_view_scheduled_job_run',
  CanViewSearch = 'can_view_search',
  CanViewService = 'can_view_service',
  CanViewSlaDefinition = 'can_view_sla_definition',
  CanViewStandard = 'can_view_standard',
  CanViewSubcontrol = 'can_view_subcontrol',
  CanViewSubprocessor = 'can_view_subprocessor',
  CanViewSubscriber = 'can_view_subscriber',
  CanViewSystemDetail = 'can_view_system_detail',
  CanViewTagDefinition = 'can_view_tag_definition',
  CanViewTask = 'can_view_task',
  CanViewTemplate = 'can_view_template',
  CanViewTrustCenter = 'can_view_trust_center',
  CanViewTrustCenterCompliance = 'can_view_trust_center_compliance',
  CanViewTrustCenterDoc = 'can_view_trust_center_doc',
  CanViewTrustCenterEntity = 'can_view_trust_center_entity',
  CanViewTrustCenterFaq = 'can_view_trust_center_faq',
  CanViewTrustCenterNdaRequest = 'can_view_trust_center_nda_request',
  CanViewTrustCenterSetting = 'can_view_trust_center_setting',
  CanViewTrustCenterSubprocessor = 'can_view_trust_center_subprocessor',
  CanViewTrustCenterWatermarkConfig = 'can_view_trust_center_watermark_config',
  CanViewVendorRiskScore = 'can_view_vendor_risk_score',
  CanViewVendorScoringConfig = 'can_view_vendor_scoring_config',
  CanViewVulnerability = 'can_view_vulnerability',
  CanViewWorkflowDefinition = 'can_view_workflow_definition',
}

export type TAccessRole =
  | 'access'
  | 'action_plan_creator'
  | 'admin'
  | 'assessment_creator'
  | 'asset_creator'
  | 'audit_log_viewer'
  | 'auditor'
  | 'campaign_creator'
  | 'campaign_manager'
  | 'can_create_action_plan'
  | 'can_create_api_token'
  | 'can_create_assessment'
  | 'can_create_asset'
  | 'can_create_campaign'
  | 'can_create_campaign_target'
  | 'can_create_check_result'
  | 'can_create_contact'
  | 'can_create_control'
  | 'can_create_control_implementation'
  | 'can_create_control_objective'
  | 'can_create_custom_domain'
  | 'can_create_custom_type_enum'
  | 'can_create_directory_account'
  | 'can_create_directory_group'
  | 'can_create_directory_membership'
  | 'can_create_directory_sync_run'
  | 'can_create_discussion'
  | 'can_create_document_data'
  | 'can_create_email_template'
  | 'can_create_entity'
  | 'can_create_entity_type'
  | 'can_create_evidence'
  | 'can_create_file'
  | 'can_create_finding'
  | 'can_create_finding_control'
  | 'can_create_group'
  | 'can_create_group_membership'
  | 'can_create_group_setting'
  | 'can_create_hush'
  | 'can_create_identity_holder'
  | 'can_create_internal_policy'
  | 'can_create_invite'
  | 'can_create_job_runner'
  | 'can_create_job_runner_registration_token'
  | 'can_create_job_runner_token'
  | 'can_create_job_template'
  | 'can_create_mapped_control'
  | 'can_create_narrative'
  | 'can_create_note'
  | 'can_create_notification_template'
  | 'can_create_org_membership'
  | 'can_create_platform'
  | 'can_create_procedure'
  | 'can_create_program'
  | 'can_create_program_membership'
  | 'can_create_remediation'
  | 'can_create_review'
  | 'can_create_risk'
  | 'can_create_scan'
  | 'can_create_scheduled_job'
  | 'can_create_scheduled_job_run'
  | 'can_create_sla_definition'
  | 'can_create_standard'
  | 'can_create_subcontrol'
  | 'can_create_subprocessor'
  | 'can_create_subscriber'
  | 'can_create_system_detail'
  | 'can_create_tag_definition'
  | 'can_create_task'
  | 'can_create_template'
  | 'can_create_trust_center'
  | 'can_create_trust_center_compliance'
  | 'can_create_trust_center_doc'
  | 'can_create_trust_center_entity'
  | 'can_create_trust_center_faq'
  | 'can_create_trust_center_nda_request'
  | 'can_create_trust_center_subprocessor'
  | 'can_create_trust_center_watermark_config'
  | 'can_create_vendor_risk_score'
  | 'can_create_vendor_scoring_config'
  | 'can_create_vulnerability'
  | 'can_create_workflow_definition'
  | 'can_delete'
  | 'can_delete_action_plan'
  | 'can_delete_api_token'
  | 'can_delete_assessment'
  | 'can_delete_asset'
  | 'can_delete_campaign'
  | 'can_delete_campaign_target'
  | 'can_delete_check_result'
  | 'can_delete_contact'
  | 'can_delete_control'
  | 'can_delete_control_implementation'
  | 'can_delete_control_objective'
  | 'can_delete_custom_domain'
  | 'can_delete_custom_type_enum'
  | 'can_delete_directory_account'
  | 'can_delete_directory_group'
  | 'can_delete_directory_membership'
  | 'can_delete_directory_sync_run'
  | 'can_delete_discussion'
  | 'can_delete_document_data'
  | 'can_delete_email_template'
  | 'can_delete_entity'
  | 'can_delete_entity_type'
  | 'can_delete_evidence'
  | 'can_delete_file'
  | 'can_delete_finding'
  | 'can_delete_finding_control'
  | 'can_delete_group'
  | 'can_delete_group_membership'
  | 'can_delete_group_setting'
  | 'can_delete_hush'
  | 'can_delete_identity_holder'
  | 'can_delete_internal_policy'
  | 'can_delete_invite'
  | 'can_delete_job_runner'
  | 'can_delete_job_runner_registration_token'
  | 'can_delete_job_runner_token'
  | 'can_delete_job_template'
  | 'can_delete_mapped_control'
  | 'can_delete_narrative'
  | 'can_delete_note'
  | 'can_delete_notification_template'
  | 'can_delete_org_membership'
  | 'can_delete_org_subscription'
  | 'can_delete_organization'
  | 'can_delete_organization_setting'
  | 'can_delete_platform'
  | 'can_delete_procedure'
  | 'can_delete_program'
  | 'can_delete_program_membership'
  | 'can_delete_remediation'
  | 'can_delete_review'
  | 'can_delete_risk'
  | 'can_delete_scan'
  | 'can_delete_scheduled_job'
  | 'can_delete_scheduled_job_run'
  | 'can_delete_sla_definition'
  | 'can_delete_standard'
  | 'can_delete_subcontrol'
  | 'can_delete_subprocessor'
  | 'can_delete_subscriber'
  | 'can_delete_system_detail'
  | 'can_delete_tag_definition'
  | 'can_delete_task'
  | 'can_delete_template'
  | 'can_delete_trust_center'
  | 'can_delete_trust_center_compliance'
  | 'can_delete_trust_center_doc'
  | 'can_delete_trust_center_entity'
  | 'can_delete_trust_center_faq'
  | 'can_delete_trust_center_nda_request'
  | 'can_delete_trust_center_setting'
  | 'can_delete_trust_center_subprocessor'
  | 'can_delete_trust_center_watermark_config'
  | 'can_delete_vendor_risk_score'
  | 'can_delete_vendor_scoring_config'
  | 'can_delete_vulnerability'
  | 'can_delete_workflow_definition'
  | 'can_edit'
  | 'can_edit_action_plan'
  | 'can_edit_api_token'
  | 'can_edit_assessment'
  | 'can_edit_asset'
  | 'can_edit_campaign'
  | 'can_edit_campaign_target'
  | 'can_edit_check_result'
  | 'can_edit_contact'
  | 'can_edit_control'
  | 'can_edit_control_implementation'
  | 'can_edit_control_objective'
  | 'can_edit_custom_domain'
  | 'can_edit_custom_type_enum'
  | 'can_edit_directory_account'
  | 'can_edit_directory_group'
  | 'can_edit_directory_membership'
  | 'can_edit_directory_sync_run'
  | 'can_edit_discussion'
  | 'can_edit_document_data'
  | 'can_edit_email_template'
  | 'can_edit_entity'
  | 'can_edit_entity_type'
  | 'can_edit_evidence'
  | 'can_edit_file'
  | 'can_edit_finding'
  | 'can_edit_finding_control'
  | 'can_edit_group'
  | 'can_edit_group_membership'
  | 'can_edit_group_setting'
  | 'can_edit_hush'
  | 'can_edit_identity_holder'
  | 'can_edit_internal_policy'
  | 'can_edit_invite'
  | 'can_edit_job_runner'
  | 'can_edit_job_runner_registration_token'
  | 'can_edit_job_runner_token'
  | 'can_edit_job_template'
  | 'can_edit_mapped_control'
  | 'can_edit_narrative'
  | 'can_edit_note'
  | 'can_edit_notification_template'
  | 'can_edit_org_membership'
  | 'can_edit_org_subscription'
  | 'can_edit_organization'
  | 'can_edit_organization_setting'
  | 'can_edit_platform'
  | 'can_edit_procedure'
  | 'can_edit_program'
  | 'can_edit_program_membership'
  | 'can_edit_remediation'
  | 'can_edit_review'
  | 'can_edit_risk'
  | 'can_edit_scan'
  | 'can_edit_scheduled_job'
  | 'can_edit_scheduled_job_run'
  | 'can_edit_service'
  | 'can_edit_sla_definition'
  | 'can_edit_standard'
  | 'can_edit_subcontrol'
  | 'can_edit_subprocessor'
  | 'can_edit_subscriber'
  | 'can_edit_system_detail'
  | 'can_edit_tag_definition'
  | 'can_edit_task'
  | 'can_edit_template'
  | 'can_edit_trust_center'
  | 'can_edit_trust_center_compliance'
  | 'can_edit_trust_center_doc'
  | 'can_edit_trust_center_entity'
  | 'can_edit_trust_center_faq'
  | 'can_edit_trust_center_nda_request'
  | 'can_edit_trust_center_setting'
  | 'can_edit_trust_center_subprocessor'
  | 'can_edit_trust_center_watermark_config'
  | 'can_edit_vendor_risk_score'
  | 'can_edit_vendor_scoring_config'
  | 'can_edit_vulnerability'
  | 'can_edit_workflow_definition'
  | 'can_invite_admins'
  | 'can_invite_auditors'
  | 'can_invite_members'
  | 'can_invite_super_admins'
  | 'can_manage_campaigns'
  | 'can_manage_compliance'
  | 'can_manage_group'
  | 'can_manage_policies'
  | 'can_manage_registry'
  | 'can_manage_risk'
  | 'can_manage_trust_center'
  | 'can_manage_workflows'
  | 'can_view'
  | 'can_view_action_plan'
  | 'can_view_api_token'
  | 'can_view_assessment'
  | 'can_view_asset'
  | 'can_view_campaign'
  | 'can_view_campaign_target'
  | 'can_view_check_result'
  | 'can_view_contact'
  | 'can_view_control'
  | 'can_view_control_implementation'
  | 'can_view_control_objective'
  | 'can_view_custom_domain'
  | 'can_view_custom_type_enum'
  | 'can_view_directory_account'
  | 'can_view_directory_group'
  | 'can_view_directory_membership'
  | 'can_view_directory_sync_run'
  | 'can_view_discussion'
  | 'can_view_document_data'
  | 'can_view_email_template'
  | 'can_view_entity'
  | 'can_view_entity_type'
  | 'can_view_evidence'
  | 'can_view_file'
  | 'can_view_finding'
  | 'can_view_finding_control'
  | 'can_view_group'
  | 'can_view_group_membership'
  | 'can_view_group_setting'
  | 'can_view_hush'
  | 'can_view_identity_holder'
  | 'can_view_internal_policy'
  | 'can_view_invite'
  | 'can_view_job_runner'
  | 'can_view_job_runner_registration_token'
  | 'can_view_job_runner_token'
  | 'can_view_job_template'
  | 'can_view_mapped_control'
  | 'can_view_narrative'
  | 'can_view_note'
  | 'can_view_notification_template'
  | 'can_view_org'
  | 'can_view_org_membership'
  | 'can_view_org_subscription'
  | 'can_view_organization'
  | 'can_view_organization_setting'
  | 'can_view_platform'
  | 'can_view_procedure'
  | 'can_view_program'
  | 'can_view_program_membership'
  | 'can_view_remediation'
  | 'can_view_review'
  | 'can_view_risk'
  | 'can_view_scan'
  | 'can_view_scheduled_job'
  | 'can_view_scheduled_job_run'
  | 'can_view_search'
  | 'can_view_service'
  | 'can_view_sla_definition'
  | 'can_view_standard'
  | 'can_view_subcontrol'
  | 'can_view_subprocessor'
  | 'can_view_subscriber'
  | 'can_view_system_detail'
  | 'can_view_tag_definition'
  | 'can_view_task'
  | 'can_view_template'
  | 'can_view_trust_center'
  | 'can_view_trust_center_compliance'
  | 'can_view_trust_center_doc'
  | 'can_view_trust_center_entity'
  | 'can_view_trust_center_faq'
  | 'can_view_trust_center_nda_request'
  | 'can_view_trust_center_setting'
  | 'can_view_trust_center_subprocessor'
  | 'can_view_trust_center_watermark_config'
  | 'can_view_vendor_risk_score'
  | 'can_view_vendor_scoring_config'
  | 'can_view_vulnerability'
  | 'can_view_workflow_definition'
  | 'check_result_creator'
  | 'compliance_manager'
  | 'control_creator'
  | 'control_implementation_creator'
  | 'control_objective_creator'
  | 'email_template_creator'
  | 'entity_creator'
  | 'finding_creator'
  | 'full_access'
  | 'group_creator'
  | 'group_manager'
  | 'identity_holder_creator'
  | 'internal_policy_creator'
  | 'mapped_control_creator'
  | 'member'
  | 'narrative_creator'
  | 'owner'
  | 'parent'
  | 'platform_creator'
  | 'policy_manager'
  | 'procedure_creator'
  | 'program_creator'
  | 'registry_manager'
  | 'remediation_creator'
  | 'review_creator'
  | 'risk_creator'
  | 'risk_manager'
  | 'scan_creator'
  | 'sla_definition_creator'
  | 'super_admin'
  | 'trust_center_compliance_creator'
  | 'trust_center_doc_creator'
  | 'trust_center_entity_creator'
  | 'trust_center_faq_creator'
  | 'trust_center_manager'
  | 'trust_center_nda_request_creator'
  | 'trust_center_subprocessor_creator'
  | 'user_in_context'
  | 'vulnerability_creator'
  | 'workflow_definition_creator'
  | 'workflow_manager'
