/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
/* eslint-disable */
import type * as Types from './schema-types'

export * from './schema-types'
export type ActionPlansWithFilterQueryVariables = Exact<{
  where?: Types.ActionPlanWhereInput | null | undefined
  orderBy?: Array<Types.ActionPlanOrder> | Types.ActionPlanOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface ActionPlansWithFilterQuery {
  actionPlans: {
    totalCount: number
    edges: Array<{
      node: {
        actionPlanKindID: string | null
        actionPlanKindName: string | null
        approvalRequired: boolean | null
        approverID: string | null
        blocked: boolean
        blockerReason: string | null
        completedAt: any
        createdAt: any
        createdBy: string | null
        delegateID: string | null
        description: string | null
        details: string | null
        dueDate: any
        fileID: string | null
        hasPendingWorkflow: boolean
        hasWorkflowHistory: boolean
        id: string
        metadata: any
        name: string
        priority: Types.ActionPlanPriority | null
        rawPayload: any
        requiresApproval: boolean
        reviewDue: any
        revision: string | null
        source: string | null
        status: Types.ActionPlanDocumentStatus | null
        summary: string | null
        systemOwned: boolean | null
        title: string
        updatedAt: any
        updatedBy: string | null
        url: string | null
        workflowEligibleMarker: boolean | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type ActionPlanQueryVariables = Exact<{
  actionPlanId: string
}>

export interface ActionPlanQuery {
  actionPlan: {
    actionPlanKindID: string | null
    actionPlanKindName: string | null
    approvalRequired: boolean | null
    approverID: string | null
    blocked: boolean
    blockerReason: string | null
    completedAt: any
    createdAt: any
    createdBy: string | null
    delegateID: string | null
    description: string | null
    details: string | null
    dueDate: any
    fileID: string | null
    hasPendingWorkflow: boolean
    hasWorkflowHistory: boolean
    id: string
    metadata: any
    name: string
    priority: Types.ActionPlanPriority | null
    rawPayload: any
    requiresApproval: boolean
    reviewDue: any
    revision: string | null
    source: string | null
    status: Types.ActionPlanDocumentStatus | null
    summary: string | null
    systemOwned: boolean | null
    title: string
    updatedAt: any
    updatedBy: string | null
    url: string | null
    workflowEligibleMarker: boolean | null
  }
}

export type CreateActionPlanMutationVariables = Exact<{
  input: Types.CreateActionPlanInput
}>

export interface CreateActionPlanMutation {
  createActionPlan: { actionPlan: { id: string } }
}

export type UpdateActionPlanMutationVariables = Exact<{
  updateActionPlanId: string
  input: Types.UpdateActionPlanInput
}>

export interface UpdateActionPlanMutation {
  updateActionPlan: { actionPlan: { id: string } }
}

export type DeleteActionPlanMutationVariables = Exact<{
  deleteActionPlanId: string
}>

export interface DeleteActionPlanMutation {
  deleteActionPlan: { deletedID: string }
}

export type CreateBulkCsvActionPlanMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvActionPlanMutation {
  createBulkCSVActionPlan: { actionPlans: Array<{ id: string }> | null }
}

export type DeleteBulkActionPlanMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkActionPlanMutation {
  deleteBulkActionPlan: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkActionPlanMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateActionPlanInput
}>

export interface UpdateBulkActionPlanMutation {
  updateBulkActionPlan: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type AssessmentResponsesWithFilterQueryVariables = Exact<{
  where?: Types.AssessmentResponseWhereInput | null | undefined
  orderBy?: Array<Types.AssessmentResponseOrder> | Types.AssessmentResponseOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface AssessmentResponsesWithFilterQuery {
  assessmentResponses: {
    totalCount: number
    edges: Array<{
      node: {
        assessmentID: string
        status: Types.AssessmentResponseAssessmentResponseStatus
        assignedAt: any
        campaignID: string | null
        completedAt: any
        createdAt: any
        createdBy: string | null
        documentDataID: string | null
        dueDate: any
        email: string | null
        emailClickCount: number | null
        emailClickedAt: any
        emailDeliveredAt: any
        emailMetadata: any
        emailOpenCount: number | null
        emailOpenedAt: any
        entityID: string | null
        id: string
        identityHolderID: string | null
        isDraft: boolean
        isTest: boolean
        lastEmailEventAt: any
        sendAttempts: number
        startedAt: any
        updatedAt: any
        updatedBy: string | null
        assessment: { id: string; name: string }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type AssessmentResponseQueryVariables = Exact<{
  assessmentResponseId: string
}>

export interface AssessmentResponseQuery {
  assessmentResponse: {
    assessmentID: string
    status: Types.AssessmentResponseAssessmentResponseStatus
    assignedAt: any
    campaignID: string | null
    completedAt: any
    createdAt: any
    createdBy: string | null
    documentDataID: string | null
    dueDate: any
    email: string | null
    emailClickCount: number | null
    emailClickedAt: any
    emailDeliveredAt: any
    emailMetadata: any
    emailOpenCount: number | null
    emailOpenedAt: any
    entityID: string | null
    id: string
    identityHolderID: string | null
    isDraft: boolean
    isTest: boolean
    lastEmailEventAt: any
    sendAttempts: number
    startedAt: any
    updatedAt: any
    updatedBy: string | null
    assessment: { id: string; name: string; jsonconfig: any; responseDueDuration: number | null }
    document: { id: string; data: any } | null
  }
}

export type CreateAssessmentResponseMutationVariables = Exact<{
  input: Types.CreateAssessmentResponseInput
}>

export interface CreateAssessmentResponseMutation {
  createAssessmentResponse: { assessmentResponse: { id: string } }
}

export type DeleteAssessmentResponseMutationVariables = Exact<{
  deleteAssessmentResponseId: string
}>

export interface DeleteAssessmentResponseMutation {
  deleteAssessmentResponse: { deletedID: string }
}

export type CreateAssessmentMutationVariables = Exact<{
  input: Types.CreateAssessmentInput
}>

export interface CreateAssessmentMutation {
  createAssessment: {
    assessment: {
      id: string
      name: string
      assessmentType: Types.AssessmentAssessmentType
      jsonconfig: any
      uischema: any
      templateID: string | null
      responseDueDuration: number | null
      tags: Array<string> | null
      createdAt: any
      updatedAt: any
      createdBy: string | null
      updatedBy: string | null
      owner: { id: string } | null
    }
  }
}

export type CreateAssessmentTemplateMutationVariables = Exact<{
  input: Types.CreateAssessmentTemplateInput
}>

export interface CreateAssessmentTemplateMutation {
  createAssessmentTemplate: { template: { id: string; name: string; description: string | null; tags: Array<string> | null } }
}

export type GetAssessmentByIdMinifiedQueryVariables = Exact<{
  getAssessmentId: string
}>

export interface GetAssessmentByIdMinifiedQuery {
  assessment: { id: string; name: string }
}

export type GetAssessmentQueryVariables = Exact<{
  getAssessmentId: string
}>

export interface GetAssessmentQuery {
  assessment: {
    id: string
    name: string
    assessmentType: Types.AssessmentAssessmentType
    systemOwned: boolean | null
    jsonconfig: any
    uischema: any
    templateID: string | null
    responseDueDuration: number | null
    tags: Array<string> | null
    createdAt: any
    updatedAt: any
  }
}

export type FilterAssessmentsQueryVariables = Exact<{
  where?: Types.AssessmentWhereInput | null | undefined
  orderBy?: Array<Types.AssessmentOrder> | Types.AssessmentOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface FilterAssessmentsQuery {
  assessments: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        assessmentType: Types.AssessmentAssessmentType
        systemOwned: boolean | null
        templateID: string | null
        jsonconfig: any
        responseDueDuration: number | null
        tags: Array<string> | null
        createdAt: any
        updatedAt: any
        createdBy: string | null
        updatedBy: string | null
        template: { id: string; name: string; kind: Types.TemplateTemplateKind | null } | null
        assessmentResponses: { totalCount: number }
        completedAssessmentResponses: { totalCount: number }
        campaigns: { edges: Array<{ node: { id: string; entityID: string | null } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type UpdateAssessmentMutationVariables = Exact<{
  updateAssessmentId: string
  input: Types.UpdateAssessmentInput
}>

export interface UpdateAssessmentMutation {
  updateAssessment: {
    assessment: {
      id: string
      name: string
      assessmentType: Types.AssessmentAssessmentType
      jsonconfig: any
      uischema: any
      templateID: string | null
      responseDueDuration: number | null
      tags: Array<string> | null
      createdAt: any
      updatedAt: any
      owner: { id: string } | null
    }
  }
}

export type DeleteAssessmentMutationVariables = Exact<{
  deleteAssessmentId: string
}>

export interface DeleteAssessmentMutation {
  deleteAssessment: { deletedID: string }
}

export type GetAssessmentDetailQueryVariables = Exact<{
  getAssessmentId: string
  where?: Types.AssessmentResponseWhereInput | null | undefined
  orderBy?: Array<Types.AssessmentResponseOrder> | Types.AssessmentResponseOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAssessmentDetailQuery {
  assessment: {
    id: string
    name: string
    assessmentType: Types.AssessmentAssessmentType
    systemOwned: boolean | null
    jsonconfig: any
    uischema: any
    templateID: string | null
    responseDueDuration: number | null
    tags: Array<string> | null
    createdAt: any
    updatedAt: any
    campaigns: { edges: Array<{ node: { id: string; entityID: string | null } | null } | null> | null }
    assessmentResponses: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          email: string | null
          displayName: string | null
          dueDate: any
          status: Types.AssessmentResponseAssessmentResponseStatus
          sendAttempts: number
          assignedAt: any
          startedAt: any
          completedAt: any
          emailDeliveredAt: any
          isTest: boolean
          createdAt: any
          document: { id: string; data: any } | null
        } | null
      } | null> | null
      pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
    }
  }
}

export type GetAssessmentAccessUrlQueryVariables = Exact<{
  getAssessmentId: string
}>

export interface GetAssessmentAccessUrlQuery {
  assessment: { id: string; accessURL: string | null }
}

export type GetAssessmentResponsesTotalCountQueryVariables = Exact<{
  getAssessmentId: string
  where?: Types.AssessmentResponseWhereInput | null | undefined
}>

export interface GetAssessmentResponsesTotalCountQuery {
  assessment: { id: string; assessmentResponses: { totalCount: number } }
}

export type DeleteBulkAssessmentMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkAssessmentMutation {
  deleteBulkAssessment: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type AssetsWithFilterQueryVariables = Exact<{
  where?: Types.AssetWhereInput | null | undefined
  orderBy?: Array<Types.AssetOrder> | Types.AssetOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface AssetsWithFilterQuery {
  assets: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        internalOwner: string | null
        accessModelName: string | null
        assetDataClassificationName: string | null
        assetSubtypeName: string | null
        assetType: Types.AssetAssetType
        containsPii: boolean | null
        costCenter: string | null
        cpe: string | null
        createdAt: any
        createdBy: string | null
        updatedAt: any
        updatedBy: string | null
        criticalityName: string | null
        description: string | null
        displayName: string | null
        encryptionStatusName: string | null
        environmentName: string | null
        estimatedMonthlyCost: number | null
        identifier: string | null
        physicalLocation: string | null
        purchaseDate: string | null
        region: string | null
        scopeName: string | null
        securityTierName: string | null
        sourceIdentifier: string | null
        sourceType: Types.AssetSourceType
        tags: Array<string> | null
        website: string | null
        categories: Array<string> | null
        internalOwnerGroup: { id: string; displayName: string } | null
        internalOwnerUser: { id: string; displayName: string } | null
        entities: { edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type AssetQueryVariables = Exact<{
  assetId: string
}>

export interface AssetQuery {
  asset: {
    id: string
    name: string
    internalOwner: string | null
    accessModelName: string | null
    assetDataClassificationName: string | null
    assetSubtypeName: string | null
    assetType: Types.AssetAssetType
    containsPii: boolean | null
    costCenter: string | null
    cpe: string | null
    createdAt: any
    createdBy: string | null
    updatedAt: any
    updatedBy: string | null
    criticalityName: string | null
    description: string | null
    displayName: string | null
    encryptionStatusName: string | null
    environmentName: string | null
    estimatedMonthlyCost: number | null
    identifier: string | null
    physicalLocation: string | null
    purchaseDate: string | null
    region: string | null
    scopeName: string | null
    securityTierName: string | null
    sourceIdentifier: string | null
    sourceType: Types.AssetSourceType
    tags: Array<string> | null
    website: string | null
    categories: Array<string> | null
    internalOwnerGroup: { id: string; displayName: string } | null
    internalOwnerUser: { id: string; displayName: string } | null
    entities: { edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
  }
}

export type CreateAssetMutationVariables = Exact<{
  input: Types.CreateAssetInput
}>

export interface CreateAssetMutation {
  createAsset: { asset: { id: string } }
}

export type UpdateAssetMutationVariables = Exact<{
  updateAssetId: string
  input: Types.UpdateAssetInput
}>

export interface UpdateAssetMutation {
  updateAsset: { asset: { id: string } }
}

export type DeleteAssetMutationVariables = Exact<{
  deleteAssetId: string
}>

export interface DeleteAssetMutation {
  deleteAsset: { deletedID: string }
}

export type CreateBulkCsvAssetMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvAssetMutation {
  createBulkCSVAsset: { assets: Array<{ id: string }> | null }
}

export type CreateBulkAssetMutationVariables = Exact<{
  input?: Array<Types.CreateAssetInput> | Types.CreateAssetInput | null | undefined
}>

export interface CreateBulkAssetMutation {
  createBulkAsset: { assets: Array<{ id: string }> | null }
}

export type DeleteBulkAssetMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkAssetMutation {
  deleteBulkAsset: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetAssetAssociationsQueryVariables = Exact<{
  assetId: string
}>

export interface GetAssetAssociationsQuery {
  asset: {
    scans: { totalCount: number; edges: Array<{ node: { id: string; target: string } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    identityHolders: {
      totalCount: number
      edges: Array<{ node: { id: string; fullName: string; displayID: string; identityHolderType: Types.IdentityHolderIdentityHolderType; title: string | null } | null } | null> | null
    }
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; description: string | null; displayID: string; referenceFramework: string | null } | null } | null> | null }
    internalPolicies: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    reviews: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; title: string | null; displayID: string } | null } | null> | null }
  }
}

export type UpdateBulkAssetMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateAssetInput
}>

export interface UpdateBulkAssetMutation {
  updateBulkAsset: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type CampaignTargetsWithFilterQueryVariables = Exact<{
  where?: Types.CampaignTargetWhereInput | null | undefined
  orderBy?: Array<Types.CampaignTargetOrder> | Types.CampaignTargetOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface CampaignTargetsWithFilterQuery {
  campaignTargets: {
    totalCount: number
    edges: Array<{
      node: {
        campaignID: string | null
        completedAt: string | null
        contactID: string | null
        createdAt: any
        createdBy: string | null
        email: string
        fullName: string | null
        groupID: string | null
        hasPendingWorkflow: boolean
        hasWorkflowHistory: boolean
        id: string
        metadata: any
        sentAt: string | null
        updatedAt: any
        updatedBy: string | null
        userID: string | null
        workflowEligibleMarker: boolean | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type CampaignTargetStatsQueryVariables = Exact<{
  where?: Types.CampaignTargetWhereInput | null | undefined
}>

export interface CampaignTargetStatsQuery {
  campaignTargets: { totalCount: number; edges: Array<{ node: { id: string; email: string; sentAt: string | null; completedAt: string | null; metadata: any } | null } | null> | null }
}

export type CampaignTargetQueryVariables = Exact<{
  campaignTargetId: string
}>

export interface CampaignTargetQuery {
  campaignTarget: {
    campaignID: string | null
    completedAt: string | null
    contactID: string | null
    createdAt: any
    createdBy: string | null
    email: string
    fullName: string | null
    groupID: string | null
    hasPendingWorkflow: boolean
    hasWorkflowHistory: boolean
    id: string
    metadata: any
    sentAt: string | null
    updatedAt: any
    updatedBy: string | null
    userID: string | null
    workflowEligibleMarker: boolean | null
  }
}

export type CreateCampaignTargetMutationVariables = Exact<{
  input: Types.CreateCampaignTargetInput
}>

export interface CreateCampaignTargetMutation {
  createCampaignTarget: { campaignTarget: { id: string } }
}

export type CreateBulkCampaignTargetMutationVariables = Exact<{
  input?: Array<Types.CreateCampaignTargetInput> | Types.CreateCampaignTargetInput | null | undefined
}>

export interface CreateBulkCampaignTargetMutation {
  createBulkCampaignTarget: { campaignTargets: Array<{ id: string }> | null }
}

export type UpdateCampaignTargetMutationVariables = Exact<{
  updateCampaignTargetId: string
  input: Types.UpdateCampaignTargetInput
}>

export interface UpdateCampaignTargetMutation {
  updateCampaignTarget: { campaignTarget: { id: string } }
}

export type DeleteCampaignTargetMutationVariables = Exact<{
  deleteCampaignTargetId: string
}>

export interface DeleteCampaignTargetMutation {
  deleteCampaignTarget: { deletedID: string }
}

export type CampaignsWithFilterQueryVariables = Exact<{
  where?: Types.CampaignWhereInput | null | undefined
  orderBy?: Array<Types.CampaignOrder> | Types.CampaignOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface CampaignsWithFilterQuery {
  campaigns: {
    totalCount: number
    edges: Array<{
      node: {
        assessmentID: string | null
        campaignType: Types.CampaignCampaignType
        completedAt: string | null
        createdAt: any
        createdBy: string | null
        description: string | null
        displayID: string
        dueDate: string | null
        emailTemplateID: string | null
        entityID: string | null
        hasPendingWorkflow: boolean
        hasWorkflowHistory: boolean
        id: string
        internalOwner: string | null
        internalOwnerGroupID: string | null
        internalOwnerUserID: string | null
        isActive: boolean
        isRecurring: boolean
        lastResentAt: string | null
        lastRunAt: string | null
        launchedAt: string | null
        metadata: any
        name: string
        nextRunAt: string | null
        recipientCount: number | null
        recurrenceCron: string | null
        recurrenceEndAt: string | null
        recurrenceFrequency: Types.CampaignFrequency | null
        recurrenceInterval: number | null
        recurrenceTimezone: string | null
        resendCount: number | null
        scheduledAt: string | null
        status: Types.CampaignCampaignStatus
        tags: Array<string> | null
        templateID: string | null
        updatedAt: any
        updatedBy: string | null
        workflowEligibleMarker: boolean | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetCampaignByIdMinifiedQueryVariables = Exact<{
  campaignId: string
}>

export interface GetCampaignByIdMinifiedQuery {
  campaign: { id: string; name: string }
}

export type CampaignQueryVariables = Exact<{
  campaignId: string
}>

export interface CampaignQuery {
  campaign: {
    assessmentID: string | null
    campaignType: Types.CampaignCampaignType
    completedAt: string | null
    createdAt: any
    createdBy: string | null
    description: string | null
    displayID: string
    dueDate: string | null
    emailTemplateID: string | null
    entityID: string | null
    hasPendingWorkflow: boolean
    hasWorkflowHistory: boolean
    id: string
    internalOwner: string | null
    internalOwnerGroupID: string | null
    internalOwnerUserID: string | null
    isActive: boolean
    isRecurring: boolean
    lastResentAt: string | null
    lastRunAt: string | null
    launchedAt: string | null
    metadata: any
    name: string
    nextRunAt: string | null
    recipientCount: number | null
    recurrenceCron: string | null
    recurrenceEndAt: string | null
    recurrenceFrequency: Types.CampaignFrequency | null
    recurrenceInterval: number | null
    recurrenceTimezone: string | null
    resendCount: number | null
    scheduledAt: string | null
    status: Types.CampaignCampaignStatus
    tags: Array<string> | null
    templateID: string | null
    updatedAt: any
    updatedBy: string | null
    workflowEligibleMarker: boolean | null
    template: { id: string; name: string; description: string | null; updatedAt: any; jsonconfig: any } | null
  }
}

export type CreateCampaignMutationVariables = Exact<{
  input: Types.CreateCampaignInput
}>

export interface CreateCampaignMutation {
  createCampaign: { campaign: { id: string } }
}

export type CreateCampaignWithTargetsMutationVariables = Exact<{
  input: Types.CreateCampaignWithTargetsInput
}>

export interface CreateCampaignWithTargetsMutation {
  createCampaignWithTargets: { campaign: { id: string } }
}

export type UpdateCampaignMutationVariables = Exact<{
  updateCampaignId: string
  input: Types.UpdateCampaignInput
}>

export interface UpdateCampaignMutation {
  updateCampaign: { campaign: { id: string } }
}

export type DeleteCampaignMutationVariables = Exact<{
  deleteCampaignId: string
}>

export interface DeleteCampaignMutation {
  deleteCampaign: { deletedID: string }
}

export type LaunchCampaignMutationVariables = Exact<{
  input: Types.LaunchCampaignInput
}>

export interface LaunchCampaignMutation {
  launchCampaign: { queuedCount: number; skippedCount: number; campaign: { id: string; status: Types.CampaignCampaignStatus; launchedAt: string | null; scheduledAt: string | null } }
}

export type UpcomingCampaignFieldsFragment = { id: string; name: string; campaignType: Types.CampaignCampaignType; recipientCount: number | null; scheduledAt: string | null; nextRunAt: string | null }

export type CampaignSummaryQueryVariables = Exact<{
  activeWhere?: Types.CampaignWhereInput | null | undefined
  needsAttentionWhere?: Types.CampaignWhereInput | null | undefined
  overdueWhere?: Types.CampaignWhereInput | null | undefined
  scheduledOverdueWhere?: Types.CampaignWhereInput | null | undefined
  completedRecentlyWhere?: Types.CampaignWhereInput | null | undefined
  upcomingScheduledWhere?: Types.CampaignWhereInput | null | undefined
  upcomingRecurringWhere?: Types.CampaignWhereInput | null | undefined
  activeFirst: number
  upcomingFirst: number
}>

export interface CampaignSummaryQuery {
  allCampaigns: { totalCount: number }
  activeCampaigns: { totalCount: number; edges: Array<{ node: { id: string; recipientCount: number | null } | null } | null> | null }
  needsAttentionCampaigns: { totalCount: number }
  overdueCampaigns: { totalCount: number }
  scheduledOverdueCampaigns: { totalCount: number }
  completedRecentlyCampaigns: { totalCount: number }
  upcomingScheduledCampaigns: {
    edges: Array<{
      node: { id: string; name: string; campaignType: Types.CampaignCampaignType; recipientCount: number | null; scheduledAt: string | null; nextRunAt: string | null } | null
    } | null> | null
  }
  upcomingRecurringCampaigns: {
    edges: Array<{
      node: { id: string; name: string; campaignType: Types.CampaignCampaignType; recipientCount: number | null; scheduledAt: string | null; nextRunAt: string | null } | null
    } | null> | null
  }
}

export type SendCampaignTestEmailMutationVariables = Exact<{
  input: Types.SendCampaignTestEmailInput
}>

export interface SendCampaignTestEmailMutation {
  sendCampaignTestEmail: { queuedCount: number; skippedCount: number }
}

export type ResendCampaignIncompleteTargetsMutationVariables = Exact<{
  input: Types.ResendCampaignIncompleteInput
}>

export interface ResendCampaignIncompleteTargetsMutation {
  resendCampaignIncompleteTargets: { queuedCount: number; skippedCount: number }
}

export type CheckResultsWithFilterQueryVariables = Exact<{
  where?: Types.CheckResultWhereInput | null | undefined
  orderBy?: Array<Types.CheckResultOrder> | Types.CheckResultOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface CheckResultsWithFilterQuery {
  checkResults: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        details: string | null
        externalURI: string | null
        id: string
        integrationID: string | null
        lastObservedAt: string | null
        parentExternalID: string | null
        source: string
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type CheckResultQueryVariables = Exact<{
  checkResultId: string
}>

export interface CheckResultQuery {
  checkResult: {
    createdAt: any
    createdBy: string | null
    details: string | null
    externalURI: string | null
    id: string
    integrationID: string | null
    lastObservedAt: string | null
    parentExternalID: string | null
    source: string
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateCheckResultMutationVariables = Exact<{
  input: Types.CreateCheckResultInput
}>

export interface CreateCheckResultMutation {
  createCheckResult: { checkResult: { id: string } }
}

export type UpdateCheckResultMutationVariables = Exact<{
  updateCheckResultId: string
  input: Types.UpdateCheckResultInput
}>

export interface UpdateCheckResultMutation {
  updateCheckResult: { checkResult: { id: string } }
}

export type DeleteCheckResultMutationVariables = Exact<{
  deleteCheckResultId: string
}>

export interface DeleteCheckResultMutation {
  deleteCheckResult: { deletedID: string }
}

export type CreateBulkCsvCheckResultMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvCheckResultMutation {
  createBulkCSVCheckResult: { checkResults: Array<{ id: string }> | null }
}

export type DeleteBulkCheckResultMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkCheckResultMutation {
  deleteBulkCheckResult: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkCheckResultMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateCheckResultInput
}>

export interface UpdateBulkCheckResultMutation {
  updateBulkCheckResult: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetContactsQueryVariables = Exact<{
  where?: Types.ContactWhereInput | null | undefined
  first?: number | null | undefined
}>

export interface GetContactsQuery {
  contacts: {
    edges: Array<{
      node: {
        id: string
        fullName: string | null
        email: string | null
        company: string | null
        title: string | null
        phoneNumber: string | null
        address: string | null
        status: Types.ContactUserStatus
      } | null
    } | null> | null
  }
}

export type ContactsWithFilterQueryVariables = Exact<{
  where?: Types.ContactWhereInput | null | undefined
  orderBy?: Array<Types.ContactOrder> | Types.ContactOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface ContactsWithFilterQuery {
  contacts: {
    totalCount: number
    edges: Array<{
      node: {
        address: string | null
        company: string | null
        createdAt: any
        createdBy: string | null
        email: string | null
        fullName: string | null
        id: string
        phoneNumber: string | null
        status: Types.ContactUserStatus
        tags: Array<string> | null
        title: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type ContactQueryVariables = Exact<{
  contactId: string
}>

export interface ContactQuery {
  contact: {
    address: string | null
    company: string | null
    createdAt: any
    createdBy: string | null
    email: string | null
    fullName: string | null
    id: string
    phoneNumber: string | null
    status: Types.ContactUserStatus
    tags: Array<string> | null
    title: string | null
    updatedAt: any
    updatedBy: string | null
    entities: { edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
  }
}

export type CreateContactMutationVariables = Exact<{
  input: Types.CreateContactInput
}>

export interface CreateContactMutation {
  createContact: { contact: { id: string } }
}

export type UpdateContactMutationVariables = Exact<{
  updateContactId: string
  input: Types.UpdateContactInput
}>

export interface UpdateContactMutation {
  updateContact: { contact: { id: string } }
}

export type DeleteContactMutationVariables = Exact<{
  deleteContactId: string
}>

export interface DeleteContactMutation {
  deleteContact: { deletedID: string }
}

export type CreateBulkCsvContactMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvContactMutation {
  createBulkCSVContact: { contacts: Array<{ id: string }> | null }
}

export type DeleteBulkContactMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkContactMutation {
  deleteBulkContact: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkContactMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateContactInput
}>

export interface UpdateBulkContactMutation {
  updateBulkContact: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type ControlImplementationFieldsFragment = {
  id: string
  details: string | null
  status: Types.ControlImplementationDocumentStatus | null
  implementationDate: any
  verified: boolean | null
  verificationDate: any
  controls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; description: string | null; referenceFramework: string | null } | null } | null> | null }
  subcontrols: {
    edges: Array<{
      node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; control: { refCode: string; description: string | null; id: string } } | null
    } | null> | null
  }
}

export type GetAllControlImplementationsQueryVariables = Exact<{
  where?: Types.ControlImplementationWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllControlImplementationsQuery {
  controlImplementations: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        details: string | null
        status: Types.ControlImplementationDocumentStatus | null
        implementationDate: any
        verified: boolean | null
        verificationDate: any
        controls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; description: string | null; referenceFramework: string | null } | null } | null> | null }
        subcontrols: {
          edges: Array<{
            node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; control: { refCode: string; description: string | null; id: string } } | null
          } | null> | null
        }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type CreateControlImplementationMutationVariables = Exact<{
  input: Types.CreateControlImplementationInput
}>

export interface CreateControlImplementationMutation {
  createControlImplementation: { controlImplementation: { id: string } }
}

export type UpdateControlImplementationMutationVariables = Exact<{
  updateControlImplementationId: string
  input: Types.UpdateControlImplementationInput
}>

export interface UpdateControlImplementationMutation {
  updateControlImplementation: { controlImplementation: { id: string } }
}

export type DeleteControlImplementationMutationVariables = Exact<{
  deleteControlImplementationId: string
}>

export interface DeleteControlImplementationMutation {
  deleteControlImplementation: { deletedID: string }
}

export type ControlObjectiveFieldsFragment = {
  id: string
  name: string
  status: Types.ControlObjectiveObjectiveStatus | null
  controlObjectiveType: string | null
  source: Types.ControlObjectiveControlSource | null
  category: string | null
  revision: string | null
  subcategory: string | null
  desiredOutcome: string | null
  controls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; description: string | null; referenceFramework: string | null } | null } | null> | null }
  subcontrols: {
    edges: Array<{
      node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; control: { id: string; refCode: string; description: string | null } } | null
    } | null> | null
  }
  programs: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
  evidence: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
  internalPolicies: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
  procedures: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
  risks: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
  tasks: { edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
}

export type GetAllControlObjectivesQueryVariables = Exact<{
  where?: Types.ControlObjectiveWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllControlObjectivesQuery {
  controlObjectives: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        status: Types.ControlObjectiveObjectiveStatus | null
        controlObjectiveType: string | null
        source: Types.ControlObjectiveControlSource | null
        category: string | null
        revision: string | null
        subcategory: string | null
        desiredOutcome: string | null
        controls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; description: string | null; referenceFramework: string | null } | null } | null> | null }
        subcontrols: {
          edges: Array<{
            node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; control: { id: string; refCode: string; description: string | null } } | null
          } | null> | null
        }
        programs: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
        evidence: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
        internalPolicies: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
        procedures: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
        risks: { edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
        tasks: { edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type CreateControlObjectiveMutationVariables = Exact<{
  input: Types.CreateControlObjectiveInput
}>

export interface CreateControlObjectiveMutation {
  createControlObjective: { controlObjective: { id: string } }
}

export type UpdateControlObjectiveMutationVariables = Exact<{
  updateControlObjectiveId: string
  input: Types.UpdateControlObjectiveInput
}>

export interface UpdateControlObjectiveMutation {
  updateControlObjective: { controlObjective: { id: string } }
}

export type DeleteControlObjectiveMutationVariables = Exact<{
  deleteControlObjectiveId: string
}>

export interface DeleteControlObjectiveMutation {
  deleteControlObjective: { deletedID: string }
}

export type ControlListFieldsFragment = {
  id: string
  refCode: string
  referenceFramework: string | null
  description?: string | null
  status?: Types.ControlControlStatus | null
  category?: string | null
  subcategory?: string | null
  referenceID?: string | null
  auditorReferenceID?: string | null
  source?: Types.ControlControlSource | null
  sourceName?: string | null
  controlKindName?: string | null
  title?: string | null
  updatedAt?: any
  updatedBy?: string | null
  createdAt?: any
  createdBy?: string | null
  controlOwner?: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
  subcontrols?: { totalCount: number; edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
  delegate?: { displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
  responsibleParty?: { id: string; displayName: string | null; name: string | null; logoFile: { base64: string | null } | null } | null
  controlImplementations?: { edges: Array<{ node: { details: string | null } | null } | null> | null }
  comments?: { totalCount: number }
  controlObjectives?: { edges: Array<{ node: { desiredOutcome: string | null } | null } | null> | null }
  tasks?: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
  internalPolicies?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  procedures?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  programs?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  risks?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
}

export type ControlListStandardFieldsFragment = {
  id: string
  refCode: string
  title: string | null
  description: string | null
  status: Types.ControlControlStatus | null
  category: string | null
  subcategory: string | null
  mappedCategories: Array<string> | null
  tags: Array<string> | null
  referenceFramework: string | null
  trustCenterVisibility: Types.ControlTrustCenterControlVisibility | null
  subcontrols: { totalCount: number }
  controlObjectives: { edges: Array<{ node: { desiredOutcome: string | null } | null } | null> | null }
  controlImplementations: { edges: Array<{ node: { details: string | null } | null } | null> | null }
  relatedControls?: Array<{ id: string; status: Types.ControlControlStatus | null }> | null
}

export type ControlDetailsFieldsFragment = {
  __typename: 'Control'
  id: string
  category: string | null
  refCode: string
  subcategory: string | null
  mappedCategories: Array<string> | null
  status: Types.ControlControlStatus | null
  tags: Array<string> | null
  description: string | null
  descriptionJSON: Array<any> | null
  implementationGuidance: Array<any> | null
  exampleEvidence: Array<any> | null
  evidenceRequests: Array<any> | null
  controlQuestions: Array<string> | null
  assessmentMethods: Array<any> | null
  assessmentObjectives: Array<any> | null
  testingProcedures: Array<any> | null
  references: Array<any> | null
  displayID: string
  source: Types.ControlControlSource | null
  sourceName: string | null
  controlKindName: string | null
  publicRepresentation: string | null
  auditorReferenceID: string | null
  referenceID: string | null
  referenceFramework: string | null
  title: string | null
  externalUUID: string | null
  aliases: Array<string> | null
  controlObjectives: {
    edges: Array<{ node: { id: string; status: Types.ControlObjectiveObjectiveStatus | null; desiredOutcome: string | null; name: string; displayID: string } | null } | null> | null
  }
  controlImplementations: { edges: Array<{ node: { details: string | null; status: Types.ControlImplementationDocumentStatus | null; verificationDate: any } | null } | null> | null }
  evidence: {
    edges: Array<{
      node: {
        id: string
        displayID: string
        name: string
        creationDate: string
        description: string | null
        files: { edges: Array<{ node: { id: string; providedFileName: string; presignedURL: string | null } | null } | null> | null }
      } | null
    } | null> | null
  }
  subcontrols: {
    totalCount: number
    edges: Array<{
      node: {
        __typename: 'Subcontrol'
        id: string
        refCode: string
        description: string | null
        displayID: string
        status: Types.SubcontrolControlStatus | null
        subcontrolKindName: string | null
        source: Types.SubcontrolControlSource | null
        category: string | null
        subcategory: string | null
        evidence: { edges: Array<{ node: { id: string; name: string; status: Types.EvidenceEvidenceStatus | null } | null } | null> | null }
      } | null
    } | null> | null
  }
  delegate: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
  controlOwner: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
  responsibleParty: { id: string; displayName: string | null; name: string | null; logoFile: { base64: string | null } | null } | null
}

export type GetAllControlsQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
  orderBy?: Array<Types.ControlOrder> | Types.ControlOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
  includeDescription?: boolean | null | undefined
  includeStatus?: boolean | null | undefined
  includeCategory?: boolean | null | undefined
  includeSubcategory?: boolean | null | undefined
  includeReferenceID?: boolean | null | undefined
  includeAuditorReferenceID?: boolean | null | undefined
  includeSource?: boolean | null | undefined
  includeSourceName?: boolean | null | undefined
  includeControlKindName?: boolean | null | undefined
  includeTitle?: boolean | null | undefined
  includeCreatedAt?: boolean | null | undefined
  includeCreatedBy?: boolean | null | undefined
  includeUpdatedAt?: boolean | null | undefined
  includeUpdatedBy?: boolean | null | undefined
  includeControlOwner?: boolean | null | undefined
  includeSubcontrols?: boolean | null | undefined
  includeDelegate?: boolean | null | undefined
  includeResponsibleParty?: boolean | null | undefined
  includeControlImplementations?: boolean | null | undefined
  includeComments?: boolean | null | undefined
  includeControlObjectives?: boolean | null | undefined
  includeTasks?: boolean | null | undefined
  includeInternalPolicies?: boolean | null | undefined
  includeProcedures?: boolean | null | undefined
  includePrograms?: boolean | null | undefined
  includeRisks?: boolean | null | undefined
}>

export interface GetAllControlsQuery {
  controls: {
    totalCount: number
    edges: Array<{
      cursor: any
      node: {
        __typename: 'Control'
        id: string
        refCode: string
        referenceFramework: string | null
        description?: string | null
        status?: Types.ControlControlStatus | null
        category?: string | null
        subcategory?: string | null
        referenceID?: string | null
        auditorReferenceID?: string | null
        source?: Types.ControlControlSource | null
        sourceName?: string | null
        controlKindName?: string | null
        title?: string | null
        updatedAt?: any
        updatedBy?: string | null
        createdAt?: any
        createdBy?: string | null
        controlOwner?: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
        subcontrols?: { totalCount: number; edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
        delegate?: { displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
        responsibleParty?: { id: string; displayName: string | null; name: string | null; logoFile: { base64: string | null } | null } | null
        controlImplementations?: { edges: Array<{ node: { details: string | null } | null } | null> | null }
        comments?: { totalCount: number }
        controlObjectives?: { edges: Array<{ node: { desiredOutcome: string | null } | null } | null> | null }
        tasks?: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
        internalPolicies?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
        procedures?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
        programs?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
        risks?: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetControlByIdQueryVariables = Exact<{
  controlId: string
}>

export interface GetControlByIdQuery {
  control: {
    __typename: 'Control'
    id: string
    category: string | null
    refCode: string
    subcategory: string | null
    mappedCategories: Array<string> | null
    status: Types.ControlControlStatus | null
    tags: Array<string> | null
    description: string | null
    descriptionJSON: Array<any> | null
    implementationGuidance: Array<any> | null
    exampleEvidence: Array<any> | null
    evidenceRequests: Array<any> | null
    controlQuestions: Array<string> | null
    assessmentMethods: Array<any> | null
    assessmentObjectives: Array<any> | null
    testingProcedures: Array<any> | null
    references: Array<any> | null
    displayID: string
    source: Types.ControlControlSource | null
    sourceName: string | null
    controlKindName: string | null
    publicRepresentation: string | null
    auditorReferenceID: string | null
    referenceID: string | null
    referenceFramework: string | null
    title: string | null
    externalUUID: string | null
    aliases: Array<string> | null
    controlObjectives: {
      edges: Array<{ node: { id: string; status: Types.ControlObjectiveObjectiveStatus | null; desiredOutcome: string | null; name: string; displayID: string } | null } | null> | null
    }
    controlImplementations: { edges: Array<{ node: { details: string | null; status: Types.ControlImplementationDocumentStatus | null; verificationDate: any } | null } | null> | null }
    evidence: {
      edges: Array<{
        node: {
          id: string
          displayID: string
          name: string
          creationDate: string
          description: string | null
          files: { edges: Array<{ node: { id: string; providedFileName: string; presignedURL: string | null } | null } | null> | null }
        } | null
      } | null> | null
    }
    subcontrols: {
      totalCount: number
      edges: Array<{
        node: {
          __typename: 'Subcontrol'
          id: string
          refCode: string
          description: string | null
          displayID: string
          status: Types.SubcontrolControlStatus | null
          subcontrolKindName: string | null
          source: Types.SubcontrolControlSource | null
          category: string | null
          subcategory: string | null
          evidence: { edges: Array<{ node: { id: string; name: string; status: Types.EvidenceEvidenceStatus | null } | null } | null> | null }
        } | null
      } | null> | null
    }
    delegate: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
    controlOwner: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
    responsibleParty: { id: string; displayName: string | null; name: string | null; logoFile: { base64: string | null } | null } | null
  }
}

export type GetControlAssociationsByIdQueryVariables = Exact<{
  controlId: string
}>

export interface GetControlAssociationsByIdQuery {
  control: {
    internalPolicies: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          name: string
          displayID: string
          summary: string | null
          approver: { gravatarLogoURL: string | null; logoURL: string | null; displayName: string; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
    procedures: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          name: string
          displayID: string
          summary: string | null
          approver: { gravatarLogoURL: string | null; logoURL: string | null; displayName: string; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
    tasks: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          title: string
          displayID: string
          details: string | null
          assignee: { displayName: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
    programs: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string; status: Types.ProgramProgramStatus; description: string | null } | null } | null> | null }
    risks: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string; details: string | null } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    scans: { totalCount: number; edges: Array<{ node: { id: string; target: string } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    identityHolders: {
      totalCount: number
      edges: Array<{ node: { id: string; fullName: string; displayID: string; identityHolderType: Types.IdentityHolderIdentityHolderType; title: string | null } | null } | null> | null
    }
    campaigns: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; title: string | null; displayID: string } | null } | null> | null }
    reviews: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    controlMappings: { totalCount: number; edges: Array<{ node: { id: string; findingID: string } | null } | null> | null }
  }
}

export type UpdateControlMutationVariables = Exact<{
  updateControlId: string
  input: Types.UpdateControlInput
}>

export interface UpdateControlMutation {
  updateControl: { control: { id: string } }
}

export type GetControlCountsByStatusQueryVariables = Exact<{
  programId: string
}>

export interface GetControlCountsByStatusQuery {
  created: { totalCount: number }
  needsApproval: { totalCount: number }
  changesRequested: { totalCount: number }
  approved: { totalCount: number }
}

export type GetNotImplementedControlCountQueryVariables = Exact<{ [key: string]: never }>

export interface GetNotImplementedControlCountQuery {
  controls: { totalCount: number }
}

export type CreateBulkCsvControlMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvControlMutation {
  createBulkCSVControl: { controls: Array<{ id: string }> | null }
}

export type UpdateBulkCsvControlMutationVariables = Exact<{
  input: any
}>

export interface UpdateBulkCsvControlMutation {
  updateBulkCSVControl: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type CreateBulkCsvMappedControlMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvMappedControlMutation {
  createBulkCSVMappedControl: { mappedControls: Array<{ id: string }> | null }
}

export type CloneBulkCsvControlMutationVariables = Exact<{
  input: any
}>

export interface CloneBulkCsvControlMutation {
  cloneBulkCSVControl: { controls: Array<{ id: string }> | null }
}

export type DeleteControlMutationVariables = Exact<{
  deleteControlId: string
}>

export interface DeleteControlMutation {
  deleteControl: { deletedID: string }
}

export type CreateControlMutationVariables = Exact<{
  input: Types.CreateControlInput
}>

export interface CreateControlMutation {
  createControl: { control: { id: string } }
}

export type GetControlSelectOptionsQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
  first?: number | null | undefined
}>

export interface GetControlSelectOptionsQuery {
  controls: { edges: Array<{ node: { id: string; refCode: string; category: string | null; subcategory: string | null; referenceFramework: string | null } | null } | null> | null }
}

export type GetControlCategoriesQueryVariables = Exact<{ [key: string]: never }>

export interface GetControlCategoriesQuery {
  controlCategories: Array<string> | null
}

export type GetControlSubcategoriesQueryVariables = Exact<{ [key: string]: never }>

export interface GetControlSubcategoriesQuery {
  controlSubcategories: Array<string> | null
}

export type GetControlsPaginatedQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
  after?: any
}>

export interface GetControlsPaginatedQuery {
  controls: {
    totalCount: number
    edges: Array<{
      node: {
        __typename: 'Control'
        id: string
        refCode: string
        title: string | null
        description: string | null
        category: string | null
        subcategory: string | null
        referenceFramework: string | null
      } | null
    } | null> | null
    pageInfo: { hasNextPage: boolean; endCursor: any }
  }
}

export type GetAuditorDashboardControlsQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
  programId: string
  orderBy?: Array<Types.ControlOrder> | Types.ControlOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAuditorDashboardControlsQuery {
  controls: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        refCode: string
        title: string | null
        controlOwner: { displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
        internalPolicies: { totalCount: number; edges: Array<{ node: { id: string; name: string } | null } | null> | null }
        evidence: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.EvidenceEvidenceStatus | null } | null } | null> | null }
        reviews: { edges: Array<{ node: { id: string; status: Types.ReviewReviewStatus | null; reviewedAt: string | null } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { startCursor: any; endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean }
  }
}

export type GetControlByIdMinifiedQueryVariables = Exact<{
  controlId: string
}>

export interface GetControlByIdMinifiedQuery {
  control: {
    id: string
    refCode: string
    standardID: string | null
    category: string | null
    subcategory: string | null
    description: string | null
    referenceFramework: string | null
    title: string | null
  }
}

export type GetControlsPaginatedWithListFieldsQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
  after?: any
  includeRelatedControls?: boolean | null | undefined
}>

export interface GetControlsPaginatedWithListFieldsQuery {
  controls: {
    totalCount: number
    edges: Array<{
      cursor: any
      node: {
        id: string
        refCode: string
        title: string | null
        description: string | null
        status: Types.ControlControlStatus | null
        category: string | null
        subcategory: string | null
        mappedCategories: Array<string> | null
        tags: Array<string> | null
        referenceFramework: string | null
        trustCenterVisibility: Types.ControlTrustCenterControlVisibility | null
        subcontrols: { totalCount: number }
        controlObjectives: { edges: Array<{ node: { desiredOutcome: string | null } | null } | null> | null }
        controlImplementations: { edges: Array<{ node: { details: string | null } | null } | null> | null }
        relatedControls?: Array<{ id: string; status: Types.ControlControlStatus | null }> | null
      } | null
    } | null> | null
    pageInfo: { hasNextPage: boolean; endCursor: any }
  }
}

export type ControlReportFieldsFragment = {
  id: string
  refCode: string
  title: string | null
  description: string | null
  status: Types.ControlControlStatus | null
  category: string | null
  subcategory: string | null
  referenceFramework: string | null
  controlOwner: { displayName: string; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
  relatedControls: Array<{ id: string; refCode: string; status: Types.ControlControlStatus | null; referenceFramework: string | null; isSubcontrol: boolean }> | null
  linkedPolicies: { totalCount: number; internalPolicies: Array<{ id: string; name: string; status: Types.InternalPolicyDocumentStatus }> | null } | null
  evidenceStatus: {
    totalCount: number
    worstStatus: Types.EvidenceEvidenceStatus | null
    approvedCount: number
    countByStatus: Array<{ status: Types.EvidenceEvidenceStatus; totalCount: number }> | null
  } | null
}

export type ControlReportsByCategoryQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
}>

export interface ControlReportsByCategoryQuery {
  controlReportsByCategory: Array<{
    category: string
    totalCount: number
    controls: Array<{
      id: string
      refCode: string
      title: string | null
      description: string | null
      status: Types.ControlControlStatus | null
      category: string | null
      subcategory: string | null
      referenceFramework: string | null
      subcontrols: Array<{
        id: string
        refCode: string
        title: string | null
        description: string | null
        status: Types.ControlControlStatus | null
        category: string | null
        subcategory: string | null
        referenceFramework: string | null
        controlOwner: { displayName: string; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
        relatedControls: Array<{ id: string; refCode: string; status: Types.ControlControlStatus | null; referenceFramework: string | null; isSubcontrol: boolean }> | null
        linkedPolicies: { totalCount: number; internalPolicies: Array<{ id: string; name: string; status: Types.InternalPolicyDocumentStatus }> | null } | null
        evidenceStatus: {
          totalCount: number
          worstStatus: Types.EvidenceEvidenceStatus | null
          approvedCount: number
          countByStatus: Array<{ status: Types.EvidenceEvidenceStatus; totalCount: number }> | null
        } | null
      }> | null
      controlOwner: { displayName: string; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
      relatedControls: Array<{ id: string; refCode: string; status: Types.ControlControlStatus | null; referenceFramework: string | null; isSubcontrol: boolean }> | null
      linkedPolicies: { totalCount: number; internalPolicies: Array<{ id: string; name: string; status: Types.InternalPolicyDocumentStatus }> | null } | null
      evidenceStatus: {
        totalCount: number
        worstStatus: Types.EvidenceEvidenceStatus | null
        approvedCount: number
        countByStatus: Array<{ status: Types.EvidenceEvidenceStatus; totalCount: number }> | null
      } | null
    }>
  }>
}

export type ControlReportsQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
  orderBy?: Array<Types.ControlReportOrder> | Types.ControlReportOrder | null | undefined
  first?: number | null | undefined
  after?: any
}>

export interface ControlReportsQuery {
  controlReports: {
    totalCount: number
    pageInfo: { hasNextPage: boolean; endCursor: any }
    edges: Array<{
      node: {
        id: string
        refCode: string
        title: string | null
        description: string | null
        status: Types.ControlControlStatus | null
        category: string | null
        subcategory: string | null
        referenceFramework: string | null
        subcontrols: Array<{
          id: string
          refCode: string
          title: string | null
          description: string | null
          status: Types.ControlControlStatus | null
          category: string | null
          subcategory: string | null
          referenceFramework: string | null
          controlOwner: { displayName: string; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
          relatedControls: Array<{ id: string; refCode: string; status: Types.ControlControlStatus | null; referenceFramework: string | null; isSubcontrol: boolean }> | null
          linkedPolicies: { totalCount: number; internalPolicies: Array<{ id: string; name: string; status: Types.InternalPolicyDocumentStatus }> | null } | null
          evidenceStatus: {
            totalCount: number
            worstStatus: Types.EvidenceEvidenceStatus | null
            approvedCount: number
            countByStatus: Array<{ status: Types.EvidenceEvidenceStatus; totalCount: number }> | null
          } | null
        }> | null
        controlOwner: { displayName: string; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
        relatedControls: Array<{ id: string; refCode: string; status: Types.ControlControlStatus | null; referenceFramework: string | null; isSubcontrol: boolean }> | null
        linkedPolicies: { totalCount: number; internalPolicies: Array<{ id: string; name: string; status: Types.InternalPolicyDocumentStatus }> | null } | null
        evidenceStatus: {
          totalCount: number
          worstStatus: Types.EvidenceEvidenceStatus | null
          approvedCount: number
          countByStatus: Array<{ status: Types.EvidenceEvidenceStatus; totalCount: number }> | null
        } | null
      } | null
    } | null> | null
  }
}

export type UpdateBulkControlMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateControlInput
}>

export interface UpdateBulkControlMutation {
  updateBulkControl: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetSubcontrolIdsByControlQueryVariables = Exact<{
  where?: Types.SubcontrolWhereInput | null | undefined
}>

export interface GetSubcontrolIdsByControlQuery {
  subcontrols: { edges: Array<{ node: { id: string } | null } | null> | null }
}

export type GetControlsByRefCodeQueryVariables = Exact<{
  refCodeIn?: Array<string> | string | null | undefined
}>

export interface GetControlsByRefCodeQuery {
  controls: {
    edges: Array<{
      node: {
        id: string
        refCode: string
        description: string | null
        status: Types.ControlControlStatus | null
        controlKindName: string | null
        source: Types.ControlControlSource | null
        category: string | null
        subcategory: string | null
        referenceFramework: string | null
        standardID: string | null
        ownerID: string | null
        systemOwned: boolean | null
        isTrustCenterControl: boolean | null
        internalPolicies: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
        evidence: { edges: Array<{ node: { id: string; name: string; status: Types.EvidenceEvidenceStatus | null } | null } | null> | null }
      } | null
    } | null> | null
  }
}

export type GetProgramControlsByRefCodeQueryVariables = Exact<{
  refCodeIn?: Array<string> | string | null | undefined
  programId: string
  first?: number | null | undefined
  after?: any
}>

export interface GetProgramControlsByRefCodeQuery {
  controls: { pageInfo: { hasNextPage: boolean; endCursor: any }; edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
}

export type GetControlRelatedControlsQueryVariables = Exact<{
  controlId: string
}>

export interface GetControlRelatedControlsQuery {
  control: {
    id: string
    relatedControls: Array<{
      id: string
      refCode: string
      status: Types.ControlControlStatus | null
      referenceFramework: string | null
      isSubcontrol: boolean
      parentControlID: string | null
      mappedControlReferenceIDs: Array<string> | null
      inheritedFromSubcontrolIDs: Array<string> | null
      category: string | null
      subcategory: string | null
      description: string | null
    }> | null
  }
}

export type GetControlCommentsQueryVariables = Exact<{
  controlId: string
}>

export interface GetControlCommentsQuery {
  control: { comments: { edges: Array<{ node: { id: string; createdAt: any; createdBy: string | null; text: string } | null } | null> | null } }
}

export type UpdateControlCommentMutationVariables = Exact<{
  updateControlCommentId: string
  input: Types.UpdateNoteInput
}>

export interface UpdateControlCommentMutation {
  updateControlComment: { control: { id: string } }
}

export type DeleteNoteMutationVariables = Exact<{
  deleteNoteId: string
}>

export interface DeleteNoteMutation {
  deleteNote: { deletedID: string }
}

export type DeleteBulkControlMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkControlMutation {
  deleteBulkControl: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetExistingControlsForOrganizationQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
}>

export interface GetExistingControlsForOrganizationQuery {
  controls: {
    edges: Array<{ node: { id: string; refCode: string; referenceFramework: string | null; standardID: string | null; ownerID: string | null; systemOwned: boolean | null } | null } | null> | null
  }
}

export type ControlDiscussionFieldsFragment = {
  __typename: 'Control'
  id: string
  refCode: string
  title: string | null
  discussions: {
    edges: Array<{
      node: {
        id: string
        externalID: string | null
        createdAt: any
        isResolved: boolean
        comments: {
          edges: Array<{
            node: {
              updatedBy: string | null
              updatedAt: any
              text: string
              noteRef: string | null
              isEdited: boolean
              id: string
              displayID: string
              discussionID: string | null
              createdAt: any
              createdBy: string | null
            } | null
          } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type GetControlDiscussionByIdQueryVariables = Exact<{
  controlId: string
}>

export interface GetControlDiscussionByIdQuery {
  control: {
    __typename: 'Control'
    id: string
    refCode: string
    title: string | null
    discussions: {
      edges: Array<{
        node: {
          id: string
          externalID: string | null
          createdAt: any
          isResolved: boolean
          comments: {
            edges: Array<{
              node: {
                updatedBy: string | null
                updatedAt: any
                text: string
                noteRef: string | null
                isEdited: boolean
                id: string
                displayID: string
                discussionID: string | null
                createdAt: any
                createdBy: string | null
              } | null
            } | null> | null
          }
        } | null
      } | null> | null
    }
  }
}

export type InsertControlPlateCommentMutationVariables = Exact<{
  updateControlId: string
  input: Types.UpdateControlInput
}>

export interface InsertControlPlateCommentMutation {
  updateControl: {
    control: {
      discussions: {
        edges: Array<{
          node: {
            id: string
            externalID: string | null
            isResolved: boolean
            comments: { edges: Array<{ node: { text: string; isEdited: boolean; id: string; noteRef: string | null } | null } | null> | null }
          } | null
        } | null> | null
      }
    }
  }
}

export type GetTemplateControlsWithMappingsQueryVariables = Exact<{
  where?: Types.ControlWhereInput | null | undefined
  after?: any
  first?: number | null | undefined
}>

export interface GetTemplateControlsWithMappingsQuery {
  controls: {
    pageInfo: { hasNextPage: boolean; endCursor: any }
    edges: Array<{
      node: {
        id: string
        refCode: string
        title: string | null
        category: string | null
        subcategory: string | null
        description: string | null
        relatedControls: Array<{ id: string; refCode: string; referenceFramework: string | null }> | null
      } | null
    } | null> | null
  }
}

export type CustomTypeEnumFieldsFragment = { id: string; name: string; color: string | null; objectType: string; description: string | null; field: string; systemOwned: boolean | null }

export type GetCustomTypeEnumsQueryVariables = Exact<{
  where?: Types.CustomTypeEnumWhereInput | null | undefined
}>

export interface GetCustomTypeEnumsQuery {
  customTypeEnums: {
    edges: Array<{ node: { id: string; name: string; color: string | null; objectType: string; description: string | null; field: string; systemOwned: boolean | null } | null } | null> | null
  }
}

export type GetCustomTypeEnumsPaginatedQueryVariables = Exact<{
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  where?: Types.CustomTypeEnumWhereInput | null | undefined
  orderBy?: Array<Types.CustomTypeEnumOrder> | Types.CustomTypeEnumOrder | null | undefined
}>

export interface GetCustomTypeEnumsPaginatedQuery {
  customTypeEnums: {
    totalCount: number
    edges: Array<{
      cursor: any
      node: {
        updatedBy: string | null
        updatedAt: any
        createdAt: any
        createdBy: string | null
        id: string
        name: string
        color: string | null
        objectType: string
        description: string | null
        field: string
        systemOwned: boolean | null
      } | null
    } | null> | null
    pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any; endCursor: any }
  }
}

export type GetCustomTypeEnumByIdQueryVariables = Exact<{
  id: string
}>

export interface GetCustomTypeEnumByIdQuery {
  customTypeEnum: { id: string; name: string; color: string | null; objectType: string; description: string | null; field: string; systemOwned: boolean | null }
}

export type CreateCustomTypeEnumMutationVariables = Exact<{
  input: Types.CreateCustomTypeEnumInput
}>

export interface CreateCustomTypeEnumMutation {
  createCustomTypeEnum: { customTypeEnum: { id: string; name: string; color: string | null; objectType: string; description: string | null; field: string; systemOwned: boolean | null } }
}

export type UpdateCustomTypeEnumMutationVariables = Exact<{
  id: string
  input: Types.UpdateCustomTypeEnumInput
}>

export interface UpdateCustomTypeEnumMutation {
  updateCustomTypeEnum: { customTypeEnum: { id: string; name: string; color: string | null; objectType: string; description: string | null; field: string; systemOwned: boolean | null } }
}

export type DeleteCustomTypeEnumMutationVariables = Exact<{
  id: string
}>

export interface DeleteCustomTypeEnumMutation {
  deleteCustomTypeEnum: { deletedID: string }
}

export type DirectoryAccountsWithFilterQueryVariables = Exact<{
  where?: Types.DirectoryAccountWhereInput | null | undefined
  orderBy?: Array<Types.DirectoryAccountOrder> | Types.DirectoryAccountOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface DirectoryAccountsWithFilterQuery {
  directoryAccounts: {
    totalCount: number
    edges: Array<{
      node: {
        canonicalEmail: string | null
        createdAt: any
        createdBy: string | null
        department: string | null
        directorySyncRunID: string | null
        displayID: string
        displayName: string | null
        environmentID: string | null
        environmentName: string | null
        externalID: string
        familyName: string | null
        givenName: string | null
        id: string
        integrationID: string | null
        jobTitle: string | null
        lastLoginAt: any
        lastSeenIP: string | null
        observedAt: any
        organizationUnit: string | null
        profile: any
        profileHash: string
        rawProfileFileID: string | null
        scopeID: string | null
        scopeName: string | null
        secondaryKey: string | null
        sourceVersion: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type DirectoryAccountQueryVariables = Exact<{
  directoryAccountId: string
}>

export interface DirectoryAccountQuery {
  directoryAccount: {
    canonicalEmail: string | null
    createdAt: any
    createdBy: string | null
    department: string | null
    directorySyncRunID: string | null
    displayID: string
    displayName: string | null
    environmentID: string | null
    environmentName: string | null
    externalID: string
    familyName: string | null
    givenName: string | null
    id: string
    integrationID: string | null
    jobTitle: string | null
    lastLoginAt: any
    lastSeenIP: string | null
    observedAt: any
    organizationUnit: string | null
    profile: any
    profileHash: string
    rawProfileFileID: string | null
    scopeID: string | null
    scopeName: string | null
    secondaryKey: string | null
    sourceVersion: string | null
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateDirectoryAccountMutationVariables = Exact<{
  input: Types.CreateDirectoryAccountInput
}>

export interface CreateDirectoryAccountMutation {
  createDirectoryAccount: { directoryAccount: { id: string } }
}

export type UpdateDirectoryAccountMutationVariables = Exact<{
  updateDirectoryAccountId: string
  input: Types.UpdateDirectoryAccountInput
}>

export interface UpdateDirectoryAccountMutation {
  updateDirectoryAccount: { directoryAccount: { id: string } }
}

export type DeleteDirectoryAccountMutationVariables = Exact<{
  deleteDirectoryAccountId: string
}>

export interface DeleteDirectoryAccountMutation {
  deleteDirectoryAccount: { deletedID: string }
}

export type DirectoryGroupsWithFilterQueryVariables = Exact<{
  where?: Types.DirectoryGroupWhereInput | null | undefined
  orderBy?: Array<Types.DirectoryGroupOrder> | Types.DirectoryGroupOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface DirectoryGroupsWithFilterQuery {
  directoryGroups: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        description: string | null
        directorySyncRunID: string
        displayID: string
        displayName: string | null
        email: string | null
        environmentID: string | null
        environmentName: string | null
        externalID: string
        externalSharingAllowed: boolean | null
        id: string
        integrationID: string
        memberCount: number | null
        observedAt: any
        profile: any
        profileHash: string
        rawProfileFileID: string | null
        scopeID: string | null
        scopeName: string | null
        sourceVersion: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type DirectoryGroupQueryVariables = Exact<{
  directoryGroupId: string
}>

export interface DirectoryGroupQuery {
  directoryGroup: {
    createdAt: any
    createdBy: string | null
    description: string | null
    directorySyncRunID: string
    displayID: string
    displayName: string | null
    email: string | null
    environmentID: string | null
    environmentName: string | null
    externalID: string
    externalSharingAllowed: boolean | null
    id: string
    integrationID: string
    memberCount: number | null
    observedAt: any
    profile: any
    profileHash: string
    rawProfileFileID: string | null
    scopeID: string | null
    scopeName: string | null
    sourceVersion: string | null
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateDirectoryGroupMutationVariables = Exact<{
  input: Types.CreateDirectoryGroupInput
}>

export interface CreateDirectoryGroupMutation {
  createDirectoryGroup: { directoryGroup: { id: string } }
}

export type UpdateDirectoryGroupMutationVariables = Exact<{
  updateDirectoryGroupId: string
  input: Types.UpdateDirectoryGroupInput
}>

export interface UpdateDirectoryGroupMutation {
  updateDirectoryGroup: { directoryGroup: { id: string } }
}

export type DeleteDirectoryGroupMutationVariables = Exact<{
  deleteDirectoryGroupId: string
}>

export interface DeleteDirectoryGroupMutation {
  deleteDirectoryGroup: { deletedID: string }
}

export type DirectoryMembershipsWithFilterQueryVariables = Exact<{
  where?: Types.DirectoryMembershipWhereInput | null | undefined
  orderBy?: Array<Types.DirectoryMembershipOrder> | Types.DirectoryMembershipOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface DirectoryMembershipsWithFilterQuery {
  directoryMemberships: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        directoryAccountID: string
        directoryGroupID: string
        directorySyncRunID: string
        displayID: string
        environmentID: string | null
        environmentName: string | null
        firstSeenAt: any
        id: string
        integrationID: string
        lastConfirmedRunID: string | null
        lastSeenAt: any
        metadata: any
        observedAt: any
        scopeID: string | null
        scopeName: string | null
        source: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type DirectoryMembershipQueryVariables = Exact<{
  directoryMembershipId: string
}>

export interface DirectoryMembershipQuery {
  directoryMembership: {
    createdAt: any
    createdBy: string | null
    directoryAccountID: string
    directoryGroupID: string
    directorySyncRunID: string
    displayID: string
    environmentID: string | null
    environmentName: string | null
    firstSeenAt: any
    id: string
    integrationID: string
    lastConfirmedRunID: string | null
    lastSeenAt: any
    metadata: any
    observedAt: any
    scopeID: string | null
    scopeName: string | null
    source: string | null
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateDirectoryMembershipMutationVariables = Exact<{
  input: Types.CreateDirectoryMembershipInput
}>

export interface CreateDirectoryMembershipMutation {
  createDirectoryMembership: { directoryMembership: { id: string } }
}

export type UpdateDirectoryMembershipMutationVariables = Exact<{
  updateDirectoryMembershipId: string
  input: Types.UpdateDirectoryMembershipInput
}>

export interface UpdateDirectoryMembershipMutation {
  updateDirectoryMembership: { directoryMembership: { id: string } }
}

export type DeleteDirectoryMembershipMutationVariables = Exact<{
  deleteDirectoryMembershipId: string
}>

export interface DeleteDirectoryMembershipMutation {
  deleteDirectoryMembership: { deletedID: string }
}

export type DirectorySyncRunsWithFilterQueryVariables = Exact<{
  where?: Types.DirectorySyncRunWhereInput | null | undefined
  orderBy?: Array<Types.DirectorySyncRunOrder> | Types.DirectorySyncRunOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface DirectorySyncRunsWithFilterQuery {
  directorySyncRuns: {
    totalCount: number
    edges: Array<{
      node: {
        completedAt: any
        createdAt: any
        createdBy: string | null
        deltaCount: number
        displayID: string
        environmentID: string | null
        environmentName: string | null
        error: string | null
        fullCount: number
        id: string
        integrationID: string
        rawManifestFileID: string | null
        scopeID: string | null
        scopeName: string | null
        sourceCursor: string | null
        startedAt: any
        stats: any
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type DirectorySyncRunQueryVariables = Exact<{
  directorySyncRunId: string
}>

export interface DirectorySyncRunQuery {
  directorySyncRun: {
    completedAt: any
    createdAt: any
    createdBy: string | null
    deltaCount: number
    displayID: string
    environmentID: string | null
    environmentName: string | null
    error: string | null
    fullCount: number
    id: string
    integrationID: string
    rawManifestFileID: string | null
    scopeID: string | null
    scopeName: string | null
    sourceCursor: string | null
    startedAt: any
    stats: any
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateDirectorySyncRunMutationVariables = Exact<{
  input: Types.CreateDirectorySyncRunInput
}>

export interface CreateDirectorySyncRunMutation {
  createDirectorySyncRun: { directorySyncRun: { id: string } }
}

export type UpdateDirectorySyncRunMutationVariables = Exact<{
  updateDirectorySyncRunId: string
  input: Types.UpdateDirectorySyncRunInput
}>

export interface UpdateDirectorySyncRunMutation {
  updateDirectorySyncRun: { directorySyncRun: { id: string } }
}

export type DeleteDirectorySyncRunMutationVariables = Exact<{
  deleteDirectorySyncRunId: string
}>

export interface DeleteDirectorySyncRunMutation {
  deleteDirectorySyncRun: { deletedID: string }
}

export type CreateDiscussionMutationVariables = Exact<{
  input: Types.CreateDiscussionInput
}>

export interface CreateDiscussionMutation {
  createDiscussion: { discussion: { id: string; createdAt: any; createdBy: string | null } }
}

export type UpdateDiscussionMutationVariables = Exact<{
  updateDiscussionId: string
  input: Types.UpdateDiscussionInput
  first?: number | null | undefined
}>

export interface UpdateDiscussionMutation {
  updateDiscussion: {
    discussion: {
      updatedBy: string | null
      updatedAt: any
      isResolved: boolean
      id: string
      externalID: string | null
      comments: { edges: Array<{ node: { createdAt: any; createdBy: string | null; displayID: string; id: string; isEdited: boolean; noteRef: string | null; text: string } | null } | null> | null }
    }
  }
}

export type GetDocumentationPoliciesQueryVariables = Exact<{
  where?: Types.InternalPolicyWhereInput | null | undefined
  orderBy?: Array<Types.InternalPolicyOrder> | Types.InternalPolicyOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetDocumentationPoliciesQuery {
  internalPolicies: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        status: Types.InternalPolicyDocumentStatus | null
        updatedBy: string | null
        updatedAt: any
        approver: { id: string; displayName: string } | null
        controls: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
        subcontrols: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetDocumentationProceduresQueryVariables = Exact<{
  where?: Types.ProcedureWhereInput | null | undefined
  orderBy?: Array<Types.ProcedureOrder> | Types.ProcedureOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetDocumentationProceduresQuery {
  procedures: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        status: Types.ProcedureDocumentStatus | null
        updatedBy: string | null
        updatedAt: any
        approver: { id: string; displayName: string } | null
        controls: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
        subcontrols: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetDocumentationTasksQueryVariables = Exact<{
  where?: Types.TaskWhereInput | null | undefined
  orderBy?: Array<Types.TaskOrder> | Types.TaskOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetDocumentationTasksQuery {
  tasks: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        title: string
        taskKindName: string | null
        status: Types.TaskTaskStatus
        due: string | null
        updatedAt: any
        assignee: { id: string; displayName: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetDocumentationProgramsQueryVariables = Exact<{
  where?: Types.ProgramWhereInput | null | undefined
  orderBy?: Array<Types.ProgramOrder> | Types.ProgramOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetDocumentationProgramsQuery {
  programs: {
    totalCount: number
    edges: Array<{ node: { id: string; name: string; updatedAt: any } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetDocumentationRisksQueryVariables = Exact<{
  where?: Types.RiskWhereInput | null | undefined
  orderBy?: Array<Types.RiskOrder> | Types.RiskOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetDocumentationRisksQuery {
  risks: {
    totalCount: number
    edges: Array<{ node: { id: string; name: string; updatedAt: any } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type EmailTemplateCatalogQueryVariables = Exact<{ [key: string]: never }>

export interface EmailTemplateCatalogQuery {
  emailTemplateCatalog: {
    entries: Array<{ key: string; description: string; configSchema: any; uiSchema: any; exampleValues: any; htmlPreview: string; variables: Array<{ name: string; description: string }> }>
  }
}

export type PreviewEmailTemplateQueryVariables = Exact<{
  key: string
  defaults: any
}>

export interface PreviewEmailTemplateQuery {
  previewEmailTemplate: string
}

export type EmailTemplatesWithFilterQueryVariables = Exact<{
  where?: Types.EmailTemplateWhereInput | null | undefined
  orderBy?: Array<Types.EmailTemplateOrder> | Types.EmailTemplateOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface EmailTemplatesWithFilterQuery {
  emailTemplates: {
    totalCount: number
    edges: Array<{
      node: {
        active: boolean
        createdAt: any
        createdBy: string | null
        defaults: any
        description: string | null
        format: Types.EmailTemplateNotificationTemplateFormat | null
        id: string
        integrationID: string | null
        key: string
        locale: string
        metadata: any
        name: string
        systemOwned: boolean | null
        updatedAt: any
        updatedBy: string | null
        version: number
        workflowDefinitionID: string | null
        workflowInstanceID: string | null
        campaigns: { totalCount: number }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type EmailTemplateQueryVariables = Exact<{
  emailTemplateId: string
}>

export interface EmailTemplateQuery {
  emailTemplate: {
    active: boolean
    createdAt: any
    createdBy: string | null
    defaults: any
    description: string | null
    format: Types.EmailTemplateNotificationTemplateFormat | null
    id: string
    integrationID: string | null
    key: string
    locale: string
    metadata: any
    name: string
    systemOwned: boolean | null
    updatedAt: any
    updatedBy: string | null
    version: number
    workflowDefinitionID: string | null
    workflowInstanceID: string | null
  }
}

export type CreateEmailTemplateMutationVariables = Exact<{
  input: Types.CreateEmailTemplateInput
}>

export interface CreateEmailTemplateMutation {
  createEmailTemplate: { emailTemplate: { id: string } }
}

export type UpdateEmailTemplateMutationVariables = Exact<{
  updateEmailTemplateId: string
  input: Types.UpdateEmailTemplateInput
}>

export interface UpdateEmailTemplateMutation {
  updateEmailTemplate: { emailTemplate: { id: string } }
}

export type DeleteEmailTemplateMutationVariables = Exact<{
  deleteEmailTemplateId: string
}>

export interface DeleteEmailTemplateMutation {
  deleteEmailTemplate: { deletedID: string }
}

export type CreateBulkCsvEmailTemplateMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvEmailTemplateMutation {
  createBulkCSVEmailTemplate: { emailTemplates: Array<{ id: string }> | null }
}

export type DeleteBulkEmailTemplateMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkEmailTemplateMutation {
  deleteBulkEmailTemplate: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkEmailTemplateMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateEmailTemplateInput
}>

export interface UpdateBulkEmailTemplateMutation {
  updateBulkEmailTemplate: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type EntityTypesWithFilterQueryVariables = Exact<{
  where?: Types.EntityTypeWhereInput | null | undefined
  orderBy?: Array<Types.EntityTypeOrder> | Types.EntityTypeOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface EntityTypesWithFilterQuery {
  entityTypes: {
    totalCount: number
    edges: Array<{ node: { createdAt: any; createdBy: string | null; id: string; name: string; systemOwned: boolean | null; updatedAt: any; updatedBy: string | null } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type EntityTypeQueryVariables = Exact<{
  entityTypeId: string
}>

export interface EntityTypeQuery {
  entityType: { createdAt: any; createdBy: string | null; id: string; name: string; systemOwned: boolean | null; updatedAt: any; updatedBy: string | null }
}

export type CreateEntityTypeMutationVariables = Exact<{
  input: Types.CreateEntityTypeInput
}>

export interface CreateEntityTypeMutation {
  createEntityType: { entityType: { id: string } }
}

export type UpdateEntityTypeMutationVariables = Exact<{
  updateEntityTypeId: string
  input: Types.UpdateEntityTypeInput
}>

export interface UpdateEntityTypeMutation {
  updateEntityType: { entityType: { id: string } }
}

export type DeleteEntityTypeMutationVariables = Exact<{
  deleteEntityTypeId: string
}>

export interface DeleteEntityTypeMutation {
  deleteEntityType: { deletedID: string }
}

export type CreateBulkCsvEntityTypeMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvEntityTypeMutation {
  createBulkCSVEntityType: { entityTypes: Array<{ id: string }> | null }
}

export type DeleteBulkEntityTypeMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkEntityTypeMutation {
  deleteBulkEntityType: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkEntityTypeMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateEntityTypeInput
}>

export interface UpdateBulkEntityTypeMutation {
  updateBulkEntityType: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type EntitiesWithFilterQueryVariables = Exact<{
  where?: Types.EntityWhereInput | null | undefined
  orderBy?: Array<Types.EntityOrder> | Types.EntityOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface EntitiesWithFilterQuery {
  entities: {
    totalCount: number
    edges: Array<{
      node: {
        annualSpend: number | null
        approvedForUse: boolean | null
        autoRenews: boolean | null
        billingModel: string | null
        contractEndDate: string | null
        contractRenewalAt: string | null
        contractStartDate: string | null
        createdAt: any
        createdBy: string | null
        description: string | null
        displayName: string | null
        domains: Array<string> | null
        entityRelationshipStateID: string | null
        entityRelationshipStateName: string | null
        entitySecurityQuestionnaireStatusID: string | null
        entitySecurityQuestionnaireStatusName: string | null
        entitySourceTypeID: string | null
        entitySourceTypeName: string | null
        entityTypeID: string | null
        environmentID: string | null
        environmentName: string | null
        hasSoc2: boolean | null
        id: string
        internalOwner: string | null
        lastReviewedAt: string | null
        mfaEnforced: boolean | null
        mfaSupported: boolean | null
        name: string | null
        nextReviewAt: string | null
        renewalRisk: string | null
        reviewedBy: string | null
        reviewFrequency: Types.EntityFrequency | null
        riskRating: string | null
        riskScore: number | null
        scopeID: string | null
        scopeName: string | null
        soc2PeriodEnd: string | null
        spendCurrency: string | null
        ssoEnforced: boolean | null
        status: Types.EntityEntityStatus | null
        statusPageURL: string | null
        systemOwned: boolean | null
        terminationNoticeDays: number | null
        tags: Array<string> | null
        tier: Types.EntityVendorTier | null
        updatedAt: any
        updatedBy: string | null
        vendorMetadata: any
        logoFile: { base64: string | null } | null
        internalOwnerGroup: { id: string; displayName: string } | null
        internalOwnerUser: { id: string; displayName: string } | null
        reviewedByGroup: { id: string; displayName: string } | null
        reviewedByUser: { id: string; displayName: string } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetEntityOptionsQueryVariables = Exact<{
  where?: Types.EntityWhereInput | null | undefined
  first?: number | null | undefined
}>

export interface GetEntityOptionsQuery {
  entities: { edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
}

export type EntityQueryVariables = Exact<{
  entityId: string
}>

export interface EntityQuery {
  entity: {
    annualSpend: number | null
    approvedForUse: boolean | null
    autoRenews: boolean | null
    billingModel: string | null
    contractEndDate: string | null
    contractRenewalAt: string | null
    contractStartDate: string | null
    createdAt: any
    createdBy: string | null
    description: string | null
    displayName: string | null
    domains: Array<string> | null
    entityRelationshipStateID: string | null
    entityRelationshipStateName: string | null
    entitySecurityQuestionnaireStatusID: string | null
    entitySecurityQuestionnaireStatusName: string | null
    entitySourceTypeID: string | null
    entitySourceTypeName: string | null
    entityTypeID: string | null
    environmentID: string | null
    environmentName: string | null
    hasSoc2: boolean | null
    id: string
    internalOwner: string | null
    lastReviewedAt: string | null
    linkedAssetIds: Array<string> | null
    links: Array<string> | null
    logoFileID: string | null
    mfaEnforced: boolean | null
    mfaSupported: boolean | null
    name: string | null
    nextReviewAt: string | null
    providedServices: Array<string> | null
    renewalRisk: string | null
    reviewedBy: string | null
    reviewFrequency: Types.EntityFrequency | null
    riskRating: string | null
    riskScore: number | null
    scopeID: string | null
    scopeName: string | null
    soc2PeriodEnd: string | null
    spendCurrency: string | null
    ssoEnforced: boolean | null
    status: Types.EntityEntityStatus | null
    statusPageURL: string | null
    systemOwned: boolean | null
    tags: Array<string> | null
    terminationNoticeDays: number | null
    tier: Types.EntityVendorTier | null
    updatedAt: any
    updatedBy: string | null
    vendorMetadata: any
    integrations: { edges: Array<{ node: { id: string; definitionID: string | null; name: string; directoryGroups: { totalCount: number } } | null } | null> | null }
    internalOwnerGroup: { id: string; displayName: string } | null
    internalOwnerUser: { id: string; displayName: string } | null
    logoFile: { base64: string | null } | null
    reviewedByGroup: { id: string; displayName: string } | null
    reviewedByUser: { id: string; displayName: string } | null
  }
}

export type CreateEntityMutationVariables = Exact<{
  input: Types.CreateEntityInput
  entityTypeName?: string | null | undefined
}>

export interface CreateEntityMutation {
  createEntity: { entity: { id: string } }
}

export type UpdateEntityMutationVariables = Exact<{
  updateEntityId: string
  input: Types.UpdateEntityInput
}>

export interface UpdateEntityMutation {
  updateEntity: { entity: { id: string } }
}

export type DeleteEntityMutationVariables = Exact<{
  deleteEntityId: string
}>

export interface DeleteEntityMutation {
  deleteEntity: { deletedID: string }
}

export type CreateBulkCsvEntityMutationVariables = Exact<{
  input: any
  entityTypeName?: string | null | undefined
}>

export interface CreateBulkCsvEntityMutation {
  createBulkCSVEntity: { entities: Array<{ id: string }> | null }
}

export type CreateBulkEntityMutationVariables = Exact<{
  input?: Array<Types.CreateEntityInput> | Types.CreateEntityInput | null | undefined
  entityTypeName?: string | null | undefined
}>

export interface CreateBulkEntityMutation {
  createBulkEntity: { entities: Array<{ id: string }> | null }
}

export type DeleteBulkEntityMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkEntityMutation {
  deleteBulkEntity: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkEntityMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateEntityInput
}>

export interface UpdateBulkEntityMutation {
  updateBulkEntity: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetEntityFilesPaginatedQueryVariables = Exact<{
  entityId: string
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  orderBy?: Array<Types.FileOrder> | Types.FileOrder | null | undefined
  where?: Types.FileWhereInput | null | undefined
}>

export interface GetEntityFilesPaginatedQuery {
  entity: {
    files: {
      totalCount: number
      pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
      edges: Array<{
        node: {
          providedFileName: string
          providedFileSize: number | null
          providedFileExtension: string
          id: string
          uri: string | null
          presignedURL: string | null
          categoryType: string | null
          createdAt: any
        } | null
      } | null> | null
    }
  }
}

export type UpdateEntityWithFilesMutationVariables = Exact<{
  updateEntityId: string
  input: Types.UpdateEntityInput
  entityFiles?: Array<any> | any | null | undefined
  logoFile?: any
}>

export interface UpdateEntityWithFilesMutation {
  updateEntity: { entity: { id: string } }
}

export type CreateEntityWithFilesMutationVariables = Exact<{
  input: Types.CreateEntityInput
  entityTypeName?: string | null | undefined
  entityFiles?: Array<any> | any | null | undefined
  logoFile?: any
}>

export interface CreateEntityWithFilesMutation {
  createEntity: { entity: { id: string } }
}

export type GetEntityCommentsQueryVariables = Exact<{
  entityId: string
}>

export interface GetEntityCommentsQuery {
  entity: { id: string; notes: { edges: Array<{ node: { id: string; createdAt: any; createdBy: string | null; text: string } | null } | null> | null } }
}

export type GetEntityAssociationsQueryVariables = Exact<{
  entityId: string
}>

export interface GetEntityAssociationsQuery {
  entity: {
    assets: {
      totalCount: number
      edges: Array<{ node: { id: string; name: string; displayName: string | null; environmentName: string | null; scopeName: string | null; assetType: Types.AssetAssetType } | null } | null> | null
    }
    scans: { totalCount: number; edges: Array<{ node: { id: string; target: string } | null } | null> | null }
    campaigns: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    identityHolders: {
      totalCount: number
      edges: Array<{ node: { id: string; fullName: string; displayID: string; identityHolderType: Types.IdentityHolderIdentityHolderType; title: string | null } | null } | null> | null
    }
    integrations: {
      totalCount: number
      edges: Array<{
        node: { id: string; name: string; kind: string | null; description: string | null; environmentName: string | null; integrationType: string | null; updatedAt: any } | null
      } | null> | null
    }
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; title: string | null; description: string | null } | null } | null> | null }
    internalPolicies: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    reviews: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; title: string | null; displayID: string } | null } | null> | null }
  }
}

export type CreateEvidenceMutationVariables = Exact<{
  input: Types.CreateEvidenceInput
  evidenceFiles?: Array<any> | any | null | undefined
}>

export interface CreateEvidenceMutation {
  createEvidence: { evidence: { id: string } }
}

export type GetEvidenceFilesQueryVariables = Exact<{
  where?: Types.FileWhereInput | null | undefined
  first?: number | null | undefined
  last?: number | null | undefined
  before?: any
  after?: any
}>

export interface GetEvidenceFilesQuery {
  files: {
    totalCount: number
    pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
    edges: Array<{
      node: {
        id: string
        providedFileName: string
        providedFileSize: number | null
        presignedURL: string | null
        providedFileExtension: string
        detectedMimeType: string | null
        categoryType: string | null
        createdAt: any
      } | null
    } | null> | null
  }
}

export type GetAllEvidencesQueryVariables = Exact<{
  where?: Types.EvidenceWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllEvidencesQuery {
  evidences: {
    totalCount: number
    edges: Array<{ node: { id: string; name: string; displayID: string; description: string | null } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type EvidenceFieldsFragment = {
  collectionProcedure: string | null
  createdAt: any
  createdBy: string | null
  creationDate: string
  description: string | null
  displayID: string
  id: string
  name: string
  renewalDate: string | null
  reviewFrequency: Types.EvidenceFrequency | null
  externalUUID: string | null
  scopeName: string | null
  environmentName: string | null
  source: string | null
  status: Types.EvidenceEvidenceStatus | null
  tags: Array<string> | null
  url: string | null
  updatedBy: string | null
  updatedAt: any
  programs: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
  subcontrols: { totalCount: number; edges: Array<{ node: { id: string; referenceFramework: string | null; refCode: string } | null } | null> | null }
  tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
  controlObjectives: {
    totalCount: number
    edges: Array<{
      node: { id: string; name: string; displayID: string; desiredOutcome: string | null; controls: { edges: Array<{ node: { id: string } | null } | null> | null } } | null
    } | null> | null
  }
  controls: { totalCount: number; edges: Array<{ node: { id: string; referenceFramework: string | null; refCode: string } | null } | null> | null }
  controlImplementations: {
    totalCount: number
    edges: Array<{ node: { id: string; details: string | null; controls: { edges: Array<{ node: { refCode: string } | null } | null> | null } } | null } | null> | null
  }
  scans: { totalCount: number; edges: Array<{ node: { id: string; target: string } | null } | null> | null }
}

export type GetEvidenceQueryVariables = Exact<{
  evidenceId: string
}>

export interface GetEvidenceQuery {
  evidence: {
    collectionProcedure: string | null
    createdAt: any
    createdBy: string | null
    creationDate: string
    description: string | null
    displayID: string
    id: string
    name: string
    renewalDate: string | null
    reviewFrequency: Types.EvidenceFrequency | null
    externalUUID: string | null
    scopeName: string | null
    environmentName: string | null
    source: string | null
    status: Types.EvidenceEvidenceStatus | null
    tags: Array<string> | null
    url: string | null
    updatedBy: string | null
    updatedAt: any
    programs: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; referenceFramework: string | null; refCode: string } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
    controlObjectives: {
      totalCount: number
      edges: Array<{
        node: { id: string; name: string; displayID: string; desiredOutcome: string | null; controls: { edges: Array<{ node: { id: string } | null } | null> | null } } | null
      } | null> | null
    }
    controls: { totalCount: number; edges: Array<{ node: { id: string; referenceFramework: string | null; refCode: string } | null } | null> | null }
    controlImplementations: {
      totalCount: number
      edges: Array<{ node: { id: string; details: string | null; controls: { edges: Array<{ node: { refCode: string } | null } | null> | null } } | null } | null> | null
    }
    scans: { totalCount: number; edges: Array<{ node: { id: string; target: string } | null } | null> | null }
  }
}

export type GetRenewEvidenceQueryVariables = Exact<{
  evidenceId: string
}>

export interface GetRenewEvidenceQuery {
  evidence: {
    collectionProcedure: string | null
    createdAt: any
    createdBy: string | null
    creationDate: string
    description: string | null
    displayID: string
    id: string
    name: string
    renewalDate: string | null
    reviewFrequency: Types.EvidenceFrequency | null
    externalUUID: string | null
    scopeName: string | null
    environmentName: string | null
    source: string | null
    status: Types.EvidenceEvidenceStatus | null
    tags: Array<string> | null
    url: string | null
    updatedBy: string | null
    updatedAt: any
    programs: { edges: Array<{ node: { id: string } | null } | null> | null }
    subcontrols: { edges: Array<{ node: { id: string } | null } | null> | null }
    tasks: { edges: Array<{ node: { id: string } | null } | null> | null }
    controlObjectives: { edges: Array<{ node: { id: string } | null } | null> | null }
    controls: { edges: Array<{ node: { id: string } | null } | null> | null }
  }
}

export type GetEvidenceFilesPaginatedQueryVariables = Exact<{
  evidenceId: string
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  orderBy?: Array<Types.FileOrder> | Types.FileOrder | null | undefined
}>

export interface GetEvidenceFilesPaginatedQuery {
  evidence: {
    files: {
      totalCount: number
      pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
      edges: Array<{
        node: {
          providedFileName: string
          providedFileSize: number | null
          providedFileExtension: string
          detectedMimeType: string | null
          id: string
          uri: string | null
          presignedURL: string | null
        } | null
      } | null> | null
    }
  }
}

export type UpdateEvidenceMutationVariables = Exact<{
  updateEvidenceId: string
  input: Types.UpdateEvidenceInput
  evidenceFiles?: Array<any> | any | null | undefined
}>

export interface UpdateEvidenceMutation {
  updateEvidence: { evidence: { id: string } }
}

export type DeleteEvidenceMutationVariables = Exact<{
  deleteEvidenceId: string
}>

export interface DeleteEvidenceMutation {
  deleteEvidence: { deletedID: string }
}

export type GetEvidenceListQueryVariables = Exact<{
  last?: number | null | undefined
  before?: any
  first?: number | null | undefined
  after?: any
  orderBy?: Array<Types.EvidenceOrder> | Types.EvidenceOrder | null | undefined
  where?: Types.EvidenceWhereInput | null | undefined
}>

export interface GetEvidenceListQuery {
  evidences: {
    totalCount: number
    pageInfo: { endCursor: any; startCursor: any; hasNextPage: boolean; hasPreviousPage: boolean }
    edges: Array<{
      node: {
        id: string
        displayID: string
        isAutomated: boolean | null
        name: string
        status: Types.EvidenceEvidenceStatus | null
        description: string | null
        updatedBy: string | null
        updatedAt: any
        createdAt: any
        createdBy: string | null
        tags: Array<string> | null
        source: string | null
        url: string | null
        creationDate: string
        renewalDate: string | null
        externalUUID: string | null
        scopeName: string | null
        environmentName: string | null
        collectionProcedure: string | null
        controls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
        subcontrols: { edges: Array<{ node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
        comments: { totalCount: number }
      } | null
    } | null> | null
  }
}

export type GetEvidenceListLightQueryVariables = Exact<{
  last?: number | null | undefined
  before?: any
  first?: number | null | undefined
  after?: any
  orderBy?: Array<Types.EvidenceOrder> | Types.EvidenceOrder | null | undefined
  where?: Types.EvidenceWhereInput | null | undefined
}>

export interface GetEvidenceListLightQuery {
  evidences: {
    totalCount: number
    pageInfo: { endCursor: any; startCursor: any; hasNextPage: boolean; hasPreviousPage: boolean }
    edges: Array<{
      node: {
        id: string
        displayID: string
        name: string
        status: Types.EvidenceEvidenceStatus | null
        source: string | null
        updatedAt: any
        updatedBy: string | null
        controls: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
        subcontrols: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
      } | null
    } | null> | null
  }
}

export type GetEvidenceCountsByStatusByProgramIdQueryVariables = Exact<{
  programId: string
}>

export interface GetEvidenceCountsByStatusByProgramIdQuery {
  approved: { totalCount: number }
  rejected: { totalCount: number }
  ready: { totalCount: number }
  missingArtifact: { totalCount: number }
  needsRenewal: { totalCount: number }
  requested: { totalCount: number }
  draft: { totalCount: number }
  submitted: { totalCount: number }
}

export type GetEvidenceCountsByStatusAllProgramsQueryVariables = Exact<{ [key: string]: never }>

export interface GetEvidenceCountsByStatusAllProgramsQuery {
  approved: { totalCount: number }
  rejected: { totalCount: number }
  ready: { totalCount: number }
  missingArtifact: { totalCount: number }
  needsRenewal: { totalCount: number }
  requested: { totalCount: number }
  draft: { totalCount: number }
  submitted: { totalCount: number }
}

export type GetEvidencesByStatusQueryVariables = Exact<{
  where?: Types.EvidenceWhereInput | null | undefined
}>

export interface GetEvidencesByStatusQuery {
  evidences: { edges: Array<{ node: { id: string; displayID: string } | null } | null> | null }
}

export type GetEvidenceFilesByIdQueryVariables = Exact<{
  evidenceId: string
}>

export interface GetEvidenceFilesByIdQuery {
  evidence: {
    files: {
      edges: Array<{
        node: {
          providedFileName: string
          providedFileSize: number | null
          providedFileExtension: string
          detectedMimeType: string | null
          id: string
          uri: string | null
          presignedURL: string | null
        } | null
      } | null> | null
    }
  }
}

export type GetEvidenceTrendDataQueryVariables = Exact<{
  currentWeekStart: any
  previousWeekStart: any
  previousWeekEnd: any
  status?: Types.EvidenceEvidenceStatus | null | undefined
}>

export interface GetEvidenceTrendDataQuery {
  currentWeek: { totalCount: number }
  previousWeek: { totalCount: number }
}

export type GetProgramEvidenceTrendDataQueryVariables = Exact<{
  programId: string
  currentWeekStart: any
  previousWeekStart: any
  previousWeekEnd: any
  status?: Types.EvidenceEvidenceStatus | null | undefined
}>

export interface GetProgramEvidenceTrendDataQuery {
  currentWeek: { totalCount: number }
  previousWeek: { totalCount: number }
}

export type EvidenceSuggestedActionsQueryVariables = Exact<{ [key: string]: never }>

export interface EvidenceSuggestedActionsQuery {
  unlinked: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.EvidenceEvidenceStatus | null; updatedAt: any } | null } | null> | null }
  needingReview: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.EvidenceEvidenceStatus | null; updatedAt: any } | null } | null> | null }
  needsRenewal: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.EvidenceEvidenceStatus | null; updatedAt: any } | null } | null> | null }
}

export type GetItemsMissingEvidenceCountQueryVariables = Exact<{ [key: string]: never }>

export interface GetItemsMissingEvidenceCountQuery {
  evidences: { totalCount: number }
}

export type GetEvidenceCommentsQueryVariables = Exact<{
  evidenceId: string
}>

export interface GetEvidenceCommentsQuery {
  evidence: { comments: { edges: Array<{ node: { id: string; createdAt: any; createdBy: string | null; text: string } | null } | null> | null } }
}

export type UpdateEvidenceCommentMutationVariables = Exact<{
  input: Types.UpdateNoteInput
  updateEvidenceCommentId: string
}>

export interface UpdateEvidenceCommentMutation {
  updateEvidenceComment: { evidence: { id: string } }
}

export type CreateBulkCsvEvidenceMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvEvidenceMutation {
  createBulkCSVEvidence: { evidences: Array<{ id: string }> | null }
}

export type DeleteBulkEvidenceMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkEvidenceMutation {
  deleteBulkEvidence: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetEvidencesWithFileIdsQueryVariables = Exact<{
  where?: Types.EvidenceWhereInput | null | undefined
}>

export interface GetEvidencesWithFileIdsQuery {
  evidences: { edges: Array<{ node: { id: string; files: { edges: Array<{ node: { id: string } | null } | null> | null } } | null } | null> | null }
}

export type UpdateBulkEvidenceMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateEvidenceInput
}>

export interface UpdateBulkEvidenceMutation {
  updateBulkEvidence: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type CreateExportMutationVariables = Exact<{
  input: Types.CreateExportInput
}>

export interface CreateExportMutation {
  createExport: { export: { id: string; status: Types.ExportExportStatus } }
}

export type GetExportQueryVariables = Exact<{
  exportId: string
}>

export interface GetExportQuery {
  export: { status: Types.ExportExportStatus; files: { edges: Array<{ node: { presignedURL: string | null } | null } | null> | null } }
}

export type GetExportsQueryVariables = Exact<{
  where?: Types.ExportWhereInput | null | undefined
}>

export interface GetExportsQuery {
  exports: {
    edges: Array<{
      node: {
        id: string
        status: Types.ExportExportStatus
        exportType: Types.ExportExportType
        errorMessage: string | null
        files: { edges: Array<{ node: { presignedURL: string | null } | null } | null> | null }
      } | null
    } | null> | null
  }
}

export type GetFilesQueryVariables = Exact<{
  where?: Types.FileWhereInput | null | undefined
  first?: number | null | undefined
  last?: number | null | undefined
  before?: any
  after?: any
}>

export interface GetFilesQuery {
  files: {
    totalCount: number
    pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
    edges: Array<{
      node: { id: string; providedFileName: string; providedFileSize: number | null; presignedURL: string | null; providedFileExtension: string; categoryType: string | null; createdAt: any } | null
    } | null> | null
  }
}

export type FindingControlsWithFilterQueryVariables = Exact<{
  where?: Types.FindingControlWhereInput | null | undefined
  orderBy?: Array<Types.FindingControlOrder> | Types.FindingControlOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface FindingControlsWithFilterQuery {
  findingControls: {
    totalCount: number
    edges: Array<{
      node: {
        controlID: string
        createdAt: any
        createdBy: string | null
        discoveredAt: string | null
        externalControlID: string | null
        externalStandard: string | null
        externalStandardVersion: string | null
        findingID: string
        id: string
        metadata: any
        source: string | null
        standardID: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type FindingControlQueryVariables = Exact<{
  findingControlId: string
}>

export interface FindingControlQuery {
  findingControl: {
    controlID: string
    createdAt: any
    createdBy: string | null
    discoveredAt: string | null
    externalControlID: string | null
    externalStandard: string | null
    externalStandardVersion: string | null
    findingID: string
    id: string
    metadata: any
    source: string | null
    standardID: string | null
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateFindingControlMutationVariables = Exact<{
  input: Types.CreateFindingControlInput
}>

export interface CreateFindingControlMutation {
  createFindingControl: { findingControl: { id: string } }
}

export type CreateBulkFindingControlMutationVariables = Exact<{
  input?: Array<Types.CreateFindingControlInput> | Types.CreateFindingControlInput | null | undefined
}>

export interface CreateBulkFindingControlMutation {
  createBulkFindingControl: { findingControls: Array<{ id: string }> | null }
}

export type UpdateFindingControlMutationVariables = Exact<{
  updateFindingControlId: string
  input: Types.UpdateFindingControlInput
}>

export interface UpdateFindingControlMutation {
  updateFindingControl: { findingControl: { id: string } }
}

export type DeleteFindingControlMutationVariables = Exact<{
  deleteFindingControlId: string
}>

export interface DeleteFindingControlMutation {
  deleteFindingControl: { deletedID: string }
}

export type DeleteBulkFindingControlMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkFindingControlMutation {
  deleteBulkFindingControl: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type CreateBulkCsvFindingControlMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvFindingControlMutation {
  createBulkCSVFindingControl: { findingControls: Array<{ id: string }> | null }
}

export type FindingsWithFilterQueryVariables = Exact<{
  where?: Types.FindingWhereInput | null | undefined
  orderBy?: Array<Types.FindingOrder> | Types.FindingOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface FindingsWithFilterQuery {
  findings: {
    totalCount: number
    edges: Array<{
      node: {
        assessmentID: string | null
        blocksProduction: boolean | null
        category: string | null
        categories: Array<string> | null
        createdAt: any
        createdBy: string | null
        description: string | null
        displayID: string
        displayName: string | null
        environmentID: string | null
        environmentName: string | null
        eventTime: string | null
        exploitability: number | null
        externalID: string | null
        externalOwnerID: string | null
        externalURI: string | null
        findingClass: string | null
        id: string
        impact: number | null
        metadata: any
        numericSeverity: number | null
        open: boolean | null
        priority: string | null
        production: boolean | null
        public: boolean | null
        rawPayload: any
        recommendation: string | null
        recommendedActions: string | null
        references: Array<string> | null
        remediationSLA: number | null
        reportedAt: string | null
        resourceName: string | null
        scopeID: string | null
        scopeName: string | null
        score: number | null
        securityLevel: Types.FindingSecurityLevel | null
        severity: string | null
        source: string | null
        sourceUpdatedAt: string | null
        state: string | null
        stepsToReproduce: Array<string> | null
        findingStatusName: string | null
        systemOwned: boolean | null
        targetDetails: any
        updatedAt: any
        updatedBy: string | null
        validated: boolean | null
        vector: string | null
        remediations: { totalCount: number; edges: Array<{ node: { id: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type FindingQueryVariables = Exact<{
  findingId: string
}>

export interface FindingQuery {
  finding: {
    assessmentID: string | null
    blocksProduction: boolean | null
    category: string | null
    categories: Array<string> | null
    createdAt: any
    createdBy: string | null
    description: string | null
    displayID: string
    displayName: string | null
    environmentID: string | null
    environmentName: string | null
    eventTime: string | null
    exploitability: number | null
    externalID: string | null
    externalOwnerID: string | null
    externalURI: string | null
    findingClass: string | null
    id: string
    impact: number | null
    metadata: any
    numericSeverity: number | null
    open: boolean | null
    priority: string | null
    production: boolean | null
    public: boolean | null
    rawPayload: any
    recommendation: string | null
    recommendedActions: string | null
    references: Array<string> | null
    remediationSLA: number | null
    reportedAt: string | null
    resourceName: string | null
    scopeID: string | null
    scopeName: string | null
    score: number | null
    securityLevel: Types.FindingSecurityLevel | null
    severity: string | null
    source: string | null
    sourceUpdatedAt: string | null
    state: string | null
    stepsToReproduce: Array<string> | null
    findingStatusName: string | null
    systemOwned: boolean | null
    targetDetails: any
    updatedAt: any
    updatedBy: string | null
    validated: boolean | null
    vector: string | null
    integrations: { totalCount: number }
    remediations: { totalCount: number; edges: Array<{ node: { id: string } | null } | null> | null }
  }
}

export type CreateFindingMutationVariables = Exact<{
  input: Types.CreateFindingInput
}>

export interface CreateFindingMutation {
  createFinding: { finding: { id: string } }
}

export type UpdateFindingMutationVariables = Exact<{
  updateFindingId: string
  input: Types.UpdateFindingInput
}>

export interface UpdateFindingMutation {
  updateFinding: { finding: { id: string } }
}

export type DeleteFindingMutationVariables = Exact<{
  deleteFindingId: string
}>

export interface DeleteFindingMutation {
  deleteFinding: { deletedID: string }
}

export type CreateBulkCsvFindingMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvFindingMutation {
  createBulkCSVFinding: { findings: Array<{ id: string }> | null }
}

export type CreateBulkFindingMutationVariables = Exact<{
  input?: Array<Types.CreateFindingInput> | Types.CreateFindingInput | null | undefined
}>

export interface CreateBulkFindingMutation {
  createBulkFinding: { findings: Array<{ id: string }> | null }
}

export type DeleteBulkFindingMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkFindingMutation {
  deleteBulkFinding: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetFindingAssociationsQueryVariables = Exact<{
  findingId: string
}>

export interface GetFindingAssociationsQuery {
  finding: {
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; description: string | null; displayID: string } | null } | null> | null }
    controlMappings: { totalCount: number; edges: Array<{ node: { id: string; controlID: string } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string } | null } | null> | null }
    risks: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    programs: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    scans: { totalCount: number; edges: Array<{ node: { id: string; target: string } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; title: string | null; displayID: string } | null } | null> | null }
    reviews: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
  }
}

export type UpdateBulkFindingMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateFindingInput
}>

export interface UpdateBulkFindingMutation {
  updateBulkFinding: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetFindingAssociationsTimelineQueryVariables = Exact<{
  findingId: string
}>

export interface GetFindingAssociationsTimelineQuery {
  finding: {
    controls: { edges: Array<{ node: { id: string; displayID: string; refCode: string; createdAt: any } | null } | null> | null }
    subcontrols: { edges: Array<{ node: { id: string; displayID: string; refCode: string; createdAt: any } | null } | null> | null }
    risks: { edges: Array<{ node: { id: string; name: string; displayID: string; createdAt: any; createdBy: string | null } | null } | null> | null }
    programs: { edges: Array<{ node: { id: string; name: string; displayID: string; createdAt: any } | null } | null> | null }
    tasks: { edges: Array<{ node: { id: string; title: string; displayID: string; createdAt: any } | null } | null> | null }
    assets: { edges: Array<{ node: { id: string; name: string; displayName: string | null; createdAt: any } | null } | null> | null }
    scans: { edges: Array<{ node: { id: string; target: string; createdAt: any; createdBy: string | null } | null } | null> | null }
    remediations: { edges: Array<{ node: { id: string; title: string | null; displayID: string; createdAt: any } | null } | null> | null }
    reviews: { edges: Array<{ node: { id: string; title: string; createdAt: any } | null } | null> | null }
  }
}

export type GroupSettingsWithFilterQueryVariables = Exact<{
  where?: Types.GroupSettingWhereInput | null | undefined
  orderBy?: Array<Types.GroupSettingOrder> | Types.GroupSettingOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GroupSettingsWithFilterQuery {
  groupSettings: {
    totalCount: number
    edges: Array<{
      node: { createdAt: any; createdBy: string | null; groupID: string | null; id: string; syncToGithub: boolean | null; syncToSlack: boolean | null; updatedAt: any; updatedBy: string | null } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GroupSettingQueryVariables = Exact<{
  groupSettingId: string
}>

export interface GroupSettingQuery {
  groupSetting: { createdAt: any; createdBy: string | null; groupID: string | null; id: string; syncToGithub: boolean | null; syncToSlack: boolean | null; updatedAt: any; updatedBy: string | null }
}

export type CreateGroupSettingMutationVariables = Exact<{
  input: Types.CreateGroupSettingInput
}>

export interface CreateGroupSettingMutation {
  createGroupSetting: { groupSetting: { id: string } }
}

export type UpdateGroupSettingMutationVariables = Exact<{
  updateGroupSettingId: string
  input: Types.UpdateGroupSettingInput
}>

export interface UpdateGroupSettingMutation {
  updateGroupSetting: { groupSetting: { id: string } }
}

export type DeleteGroupSettingMutationVariables = Exact<{
  deleteGroupSettingId: string
}>

export interface DeleteGroupSettingMutation {
  deleteGroupSetting: { deletedID: string }
}

export type CreateBulkCsvGroupSettingMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvGroupSettingMutation {
  createBulkCSVGroupSetting: { groupSettings: Array<{ id: string }> | null }
}

export type DeleteBulkGroupSettingMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkGroupSettingMutation {
  deleteBulkGroupSetting: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkGroupSettingMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateGroupSettingInput
}>

export interface UpdateBulkGroupSettingMutation {
  updateBulkGroupSetting: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetAllGroupsQueryVariables = Exact<{
  where?: Types.GroupWhereInput | null | undefined
  orderBy?: Array<Types.GroupOrder> | Types.GroupOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllGroupsQuery {
  groups: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        description: string | null
        name: string
        displayName: string
        gravatarLogoURL: string | null
        logoURL: string | null
        tags: Array<string> | null
        updatedAt: any
        updatedBy: string | null
        createdAt: any
        createdBy: string | null
        avatarFile: { base64: string | null } | null
        members: {
          edges: Array<{
            node: {
              id: string
              role: Types.GroupMembershipRole
              user: { id: string; displayName: string; avatarRemoteURL: string | null; role: Types.UserRole | null; avatarFile: { base64: string | null } | null }
            } | null
          } | null> | null
        }
        setting: { visibility: Types.GroupSettingVisibility; joinPolicy: Types.GroupSettingJoinPolicy; syncToSlack: boolean | null; syncToGithub: boolean | null; id: string } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetGroupNamesQueryVariables = Exact<{
  where?: Types.GroupWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
}>

export interface GetGroupNamesQuery {
  groups: { edges: Array<{ node: { id: string; name: string; displayName: string } | null } | null> | null }
}

export type CreateGroupWithMembersMutationVariables = Exact<{
  groupInput: Types.CreateGroupInput
  members?: Array<Types.GroupMembersInput> | Types.GroupMembersInput | null | undefined
}>

export interface CreateGroupWithMembersMutation {
  createGroupWithMembers: { group: { id: string; displayID: string } }
}

export type UpdateGroupMutationVariables = Exact<{
  updateGroupId: string
  input: Types.UpdateGroupInput
}>

export interface UpdateGroupMutation {
  updateGroup: { group: { id: string } }
}

export type DeleteGroupMutationVariables = Exact<{
  deleteGroupId: string
}>

export interface DeleteGroupMutation {
  deleteGroup: { deletedID: string }
}

export type GetGroupDetailsQueryVariables = Exact<{
  groupId: string
}>

export interface GetGroupDetailsQuery {
  group: {
    id: string
    name: string
    description: string | null
    displayName: string
    logoURL: string | null
    gravatarLogoURL: string | null
    isManaged: boolean | null
    tags: Array<string> | null
    additionalRoles: Array<string> | null
    avatarFile: { base64: string | null } | null
    members: {
      edges: Array<{
        node: {
          id: string
          role: Types.GroupMembershipRole
          user: { id: string; displayName: string; avatarRemoteURL: string | null; role: Types.UserRole | null; avatarFile: { base64: string | null } | null }
        } | null
      } | null> | null
    }
    setting: { visibility: Types.GroupSettingVisibility; joinPolicy: Types.GroupSettingJoinPolicy; syncToSlack: boolean | null; syncToGithub: boolean | null; id: string } | null
  }
}

export type UpdateGroupMembershipMutationVariables = Exact<{
  updateGroupMembershipId: string
  input: Types.UpdateGroupMembershipInput
}>

export interface UpdateGroupMembershipMutation {
  updateGroupMembership: { groupMembership: { id: string } }
}

export type GetGroupPermissionsQueryVariables = Exact<{
  groupId: string
}>

export interface GetGroupPermissionsQuery {
  group: { permissions: { edges: Array<{ node: { id: string; name: string | null; objectType: string; permissions: Types.Permission } | null } | null> | null } }
}

export type DeleteGroupMembershipMutationVariables = Exact<{
  deleteGroupMembershipId: string
}>

export interface DeleteGroupMembershipMutation {
  deleteGroupMembership: { deletedID: string }
}

export type AllGroupsPaginatedFieldsFragment = {
  id: string
  name: string
  displayName: string
  description: string | null
  isManaged: boolean | null
  tags: Array<string> | null
  setting: { visibility: Types.GroupSettingVisibility } | null
}

export type GetAllGroupsPaginatedQueryVariables = Exact<{
  where?: Types.GroupWhereInput | null | undefined
  after?: any
  orderBy?: Array<Types.GroupOrder> | Types.GroupOrder | null | undefined
}>

export interface GetAllGroupsPaginatedQuery {
  groups: {
    totalCount: number
    edges: Array<{
      cursor: any
      node: {
        id: string
        name: string
        displayName: string
        description: string | null
        isManaged: boolean | null
        tags: Array<string> | null
        setting: { visibility: Types.GroupSettingVisibility } | null
      } | null
    } | null> | null
    pageInfo: { hasNextPage: boolean; endCursor: any }
  }
}

export type CreateBulkCsvGroupMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvGroupMutation {
  createBulkCSVGroup: { groups: Array<{ id: string }> | null }
}

export type DirectoryMembershipConnectionFieldsFragment = {
  totalCount: number
  edges: Array<{
    node: {
      id: string
      role: Types.DirectoryMembershipDirectoryMembershipRole | null
      addedAt: any
      removedAt: any
      createdAt: any
      directoryGroup: { id: string; displayName: string | null; integration: { id: string; entities: { edges: Array<{ node: { id: string; name: string | null } | null } | null> | null } } }
    } | null
  } | null> | null
}

export type IdentityHoldersWithFilterQueryVariables = Exact<{
  where?: Types.IdentityHolderWhereInput | null | undefined
  orderBy?: Array<Types.IdentityHolderOrder> | Types.IdentityHolderOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface IdentityHoldersWithFilterQuery {
  identityHolders: {
    totalCount: number
    edges: Array<{
      node: {
        emailAliases: Array<string> | null
        createdAt: any
        createdBy: string | null
        department: string | null
        displayID: string
        email: string
        employerEntityID: string | null
        endDate: string | null
        environmentID: string | null
        environmentName: string | null
        externalReferenceID: string | null
        externalUserID: string | null
        fullName: string
        hasPendingWorkflow: boolean
        hasWorkflowHistory: boolean
        id: string
        identityHolderType: Types.IdentityHolderIdentityHolderType
        internalOwner: string | null
        isActive: boolean
        isOpenlaneUser: boolean | null
        location: string | null
        metadata: any
        phoneNumber: string | null
        scopeID: string | null
        scopeName: string | null
        startDate: string | null
        status: Types.IdentityHolderUserStatus
        tags: Array<string> | null
        team: string | null
        title: string | null
        updatedAt: any
        updatedBy: string | null
        userID: string | null
        workflowEligibleMarker: boolean | null
        internalOwnerGroup: { id: string; displayName: string } | null
        internalOwnerUser: { id: string; displayName: string } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetIdentityHolderOptionsQueryVariables = Exact<{
  where?: Types.IdentityHolderWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetIdentityHolderOptionsQuery {
  identityHolders: {
    totalCount: number
    edges: Array<{ node: { id: string; email: string; fullName: string; identityHolderType: Types.IdentityHolderIdentityHolderType } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type IdentityHolderQueryVariables = Exact<{
  identityHolderId: string
}>

export interface IdentityHolderQuery {
  identityHolder: {
    alternateEmail: string | null
    avatarRemoteURL: string | null
    emailAliases: Array<string> | null
    createdAt: any
    createdBy: string | null
    department: string | null
    displayID: string
    email: string
    employerEntityID: string | null
    endDate: string | null
    environmentID: string | null
    environmentName: string | null
    externalReferenceID: string | null
    externalUserID: string | null
    fullName: string
    hasPendingWorkflow: boolean
    hasWorkflowHistory: boolean
    id: string
    identityHolderType: Types.IdentityHolderIdentityHolderType
    internalOwner: string | null
    isActive: boolean
    isOpenlaneUser: boolean | null
    location: string | null
    metadata: any
    phoneNumber: string | null
    scopeID: string | null
    scopeName: string | null
    startDate: string | null
    status: Types.IdentityHolderUserStatus
    tags: Array<string> | null
    team: string | null
    title: string | null
    updatedAt: any
    updatedBy: string | null
    userID: string | null
    workflowEligibleMarker: boolean | null
    internalOwnerGroup: { id: string; displayName: string } | null
    internalOwnerUser: { id: string; displayName: string } | null
  }
}

export type CreateIdentityHolderMutationVariables = Exact<{
  input: Types.CreateIdentityHolderInput
}>

export interface CreateIdentityHolderMutation {
  createIdentityHolder: { identityHolder: { id: string } }
}

export type UpdateIdentityHolderMutationVariables = Exact<{
  updateIdentityHolderId: string
  input: Types.UpdateIdentityHolderInput
}>

export interface UpdateIdentityHolderMutation {
  updateIdentityHolder: { identityHolder: { id: string } }
}

export type DeleteIdentityHolderMutationVariables = Exact<{
  deleteIdentityHolderId: string
}>

export interface DeleteIdentityHolderMutation {
  deleteIdentityHolder: { deletedID: string }
}

export type CreateBulkCsvIdentityHolderMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvIdentityHolderMutation {
  createBulkCSVIdentityHolder: { identityHolders: Array<{ id: string }> | null }
}

export type DeleteBulkIdentityHolderMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkIdentityHolderMutation {
  deleteBulkIdentityHolder: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkIdentityHolderMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateIdentityHolderInput
}>

export interface UpdateBulkIdentityHolderMutation {
  updateBulkIdentityHolder: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetIdentityHolderFilesPaginatedQueryVariables = Exact<{
  identityHolderId: string
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  orderBy?: Array<Types.FileOrder> | Types.FileOrder | null | undefined
  where?: Types.FileWhereInput | null | undefined
}>

export interface GetIdentityHolderFilesPaginatedQuery {
  identityHolder: {
    files: {
      totalCount: number
      pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
      edges: Array<{
        node: {
          providedFileName: string
          providedFileSize: number | null
          providedFileExtension: string
          categoryType: string | null
          createdAt: any
          id: string
          uri: string | null
          presignedURL: string | null
        } | null
      } | null> | null
    }
  }
}

export type UpdateIdentityHolderWithFilesMutationVariables = Exact<{
  updateIdentityHolderId: string
  input: Types.UpdateIdentityHolderInput
  identityHolderFiles?: Array<any> | any | null | undefined
}>

export interface UpdateIdentityHolderWithFilesMutation {
  updateIdentityHolder: { identityHolder: { id: string } }
}

export type CreateIdentityHolderWithFilesMutationVariables = Exact<{
  input: Types.CreateIdentityHolderInput
  identityHolderFiles?: Array<any> | any | null | undefined
}>

export interface CreateIdentityHolderWithFilesMutation {
  createIdentityHolder: { identityHolder: { id: string } }
}

export type GetIdentityHolderDirectoryAccountsQueryVariables = Exact<{
  identityHolderId: string
  where?: Types.DirectoryAccountWhereInput | null | undefined
  membershipWhere?: Types.DirectoryMembershipWhereInput | null | undefined
}>

export interface GetIdentityHolderDirectoryAccountsQuery {
  identityHolder: {
    directoryAccounts: {
      edges: Array<{
        node: {
          id: string
          accountType: Types.DirectoryAccountDirectoryAccountType | null
          status: Types.DirectoryAccountDirectoryAccountStatus
          primarySource: boolean
          mfaState: Types.DirectoryAccountDirectoryAccountMfaState
          directoryName: string | null
          integration: { id: string; definitionID: string | null; entities: { edges: Array<{ node: { id: string; name: string | null } | null } | null> | null } } | null
          memberships: {
            totalCount: number
            edges: Array<{
              node: {
                id: string
                role: Types.DirectoryMembershipDirectoryMembershipRole | null
                addedAt: any
                removedAt: any
                createdAt: any
                directoryGroup: { id: string; displayName: string | null; integration: { id: string; entities: { edges: Array<{ node: { id: string; name: string | null } | null } | null> | null } } }
              } | null
            } | null> | null
          }
        } | null
      } | null> | null
    }
  }
}

export type GetIdentityHolderAssociationsQueryVariables = Exact<{
  identityHolderId: string
}>

export interface GetIdentityHolderAssociationsQuery {
  identityHolder: {
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    campaigns: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string; description: string | null } | null } | null> | null }
    internalPolicies: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string; summary: string | null } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string } | null } | null> | null }
  }
}

export type GetIdentityHolderAssociationsTimelineQueryVariables = Exact<{
  identityHolderId: string
}>

export interface GetIdentityHolderAssociationsTimelineQuery {
  identityHolder: {
    assessmentResponses: { edges: Array<{ node: { id: string; createdAt: any; completedAt: any; assessment: { id: string; name: string } } | null } | null> | null }
    directoryAccounts: {
      edges: Array<{
        node: {
          id: string
          createdAt: any
          directoryName: string | null
          displayName: string | null
          canonicalEmail: string | null
          integration: { definitionID: string | null } | null
          memberships: {
            totalCount: number
            edges: Array<{
              node: {
                id: string
                role: Types.DirectoryMembershipDirectoryMembershipRole | null
                addedAt: any
                removedAt: any
                createdAt: any
                directoryGroup: { id: string; displayName: string | null; integration: { id: string; entities: { edges: Array<{ node: { id: string; name: string | null } | null } | null> | null } } }
              } | null
            } | null> | null
          }
        } | null
      } | null> | null
    }
    user: { id: string; createdAt: any; displayName: string; email: string } | null
  }
}

export type GetIdentityHolderEdgesForMergeQueryVariables = Exact<{
  identityHolderId: string
}>

export interface GetIdentityHolderEdgesForMergeQuery {
  identityHolder: {
    id: string
    userID: string | null
    directoryAccounts: { edges: Array<{ node: { id: string } | null } | null> | null }
    assessmentResponses: { edges: Array<{ node: { id: string } | null } | null> | null }
    assets: { edges: Array<{ node: { id: string } | null } | null> | null }
    entities: { edges: Array<{ node: { id: string } | null } | null> | null }
    campaigns: { edges: Array<{ node: { id: string } | null } | null> | null }
    tasks: { edges: Array<{ node: { id: string } | null } | null> | null }
    controls: { edges: Array<{ node: { id: string } | null } | null> | null }
    internalPolicies: { edges: Array<{ node: { id: string } | null } | null> | null }
    subcontrols: { edges: Array<{ node: { id: string } | null } | null> | null }
    findings: { edges: Array<{ node: { id: string } | null } | null> | null }
    files: { edges: Array<{ node: { id: string } | null } | null> | null }
  }
}

export type GetIntegrationsQueryVariables = Exact<{
  where?: Types.IntegrationWhereInput | null | undefined
}>

export interface GetIntegrationsQuery {
  integrations: {
    edges: Array<{
      node: {
        id: string
        name: string
        kind: string | null
        integrationType: string | null
        definitionID: string | null
        definitionSlug: string | null
        family: string | null
        status: Types.IntegrationIntegrationStatus
        tags: Array<string> | null
        description: string | null
        metadata: any
        primaryDirectory: boolean
        createdAt: any
        createdBy: string | null
        environmentName: string | null
        scopeName: string | null
        credentials: any
        config: any
      } | null
    } | null> | null
  }
}

export type DeleteIntegrationMutationVariables = Exact<{
  deleteIntegrationId: string
}>

export interface DeleteIntegrationMutation {
  deleteIntegration: { deletedID: string }
}

export type CreateInternalPolicyMutationVariables = Exact<{
  input: Types.CreateInternalPolicyInput
}>

export interface CreateInternalPolicyMutation {
  createInternalPolicy: { internalPolicy: { id: string; name: string; internalPolicyKindName: string | null; details: string | null } }
}

export type UpdateInternalPolicyMutationVariables = Exact<{
  updateInternalPolicyId: string
  input: Types.UpdateInternalPolicyInput
  internalPolicyFile?: any
  internalPolicyFileMetadata?: Types.FileMetadataInput | null | undefined
}>

export interface UpdateInternalPolicyMutation {
  updateInternalPolicy: {
    internalPolicy: {
      id: string
      name: string
      internalPolicyKindName: string | null
      details: string | null
      revision: string | null
      managementMode: Types.InternalPolicyDocumentManagementMode | null
      file: { id: string; presignedURL: string | null; providedFileName: string; providedFileExtension: string; detectedMimeType: string | null } | null
    }
  }
}

export type DeleteInternalPolicyMutationVariables = Exact<{
  deleteInternalPolicyId: string
}>

export interface DeleteInternalPolicyMutation {
  deleteInternalPolicy: { deletedID: string }
}

export type GetInternalPolicyNamesQueryVariables = Exact<{
  first?: number | null | undefined
  after?: any
}>

export interface GetInternalPolicyNamesQuery {
  internalPolicies: { totalCount: number; pageInfo: { endCursor: any; hasNextPage: boolean }; edges: Array<{ node: { id: string; name: string; summary: string | null } | null } | null> | null }
}

export type GetInternalPoliciesListQueryVariables = Exact<{
  orderBy?: Array<Types.InternalPolicyOrder> | Types.InternalPolicyOrder | null | undefined
  where?: Types.InternalPolicyWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetInternalPoliciesListQuery {
  internalPolicies: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        updatedAt: any
        updatedBy: string | null
        createdAt: any
        createdBy: string | null
        summary: string | null
        managementMode: Types.InternalPolicyDocumentManagementMode | null
        approvalRequired: boolean | null
        internalPolicyKindName: string | null
        reviewDue: any
        reviewFrequency: Types.InternalPolicyFrequency | null
        revision: string | null
        status: Types.InternalPolicyDocumentStatus | null
        tags: Array<string> | null
        approver: { displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
        delegate: { displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
        controls: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
        procedures: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetAllInternalPoliciesQueryVariables = Exact<{
  where?: Types.InternalPolicyWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllInternalPoliciesQuery {
  internalPolicies: {
    totalCount: number
    edges: Array<{ node: { id: string; name: string; summary: string | null; displayID: string } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type InternalPolicyByIdFragment = {
  id: string
  name: string
  details: string | null
  createdAt: any
  createdBy: string | null
  updatedAt: any
  updatedBy: string | null
  tags: Array<string> | null
  revision: string | null
  status: Types.InternalPolicyDocumentStatus | null
  managementMode: Types.InternalPolicyDocumentManagementMode | null
  displayID: string
  reviewDue: any
  reviewFrequency: Types.InternalPolicyFrequency | null
  approvalRequired: boolean | null
  summary: string | null
  detailsJSON: Array<any> | null
  internalPolicyKindName: string | null
  liveExternalContents: string | null
  url: string | null
  externalFileID: string | null
  integrations: {
    edges: Array<{
      node: {
        id: string
        name: string
        kind: string | null
        integrationType: string | null
        description: string | null
        definitionID: string | null
        definitionSlug: string | null
        definitionVersion: string | null
        family: string | null
        environmentID: string | null
        environmentName: string | null
        scopeID: string | null
        scopeName: string | null
        platformID: string | null
        status: Types.IntegrationIntegrationStatus
        primaryDirectory: boolean
        campaignEmail: boolean
        systemOwned: boolean | null
        tags: Array<string> | null
        config: any
        metadata: any
        providerMetadataSnapshot: any
        webhookURLs: any
        ownerID: string | null
        createdAt: any
        createdBy: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
  }
  file: { id: string; presignedURL: string | null; providedFileName: string; providedFileExtension: string; detectedMimeType: string | null } | null
  approver: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
  delegate: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
}

export type GetInternalPolicyByIdMinifiedQueryVariables = Exact<{
  internalPolicyId: string
}>

export interface GetInternalPolicyByIdMinifiedQuery {
  internalPolicy: { id: string; name: string }
}

export type GetInternalPolicyDetailsByIdQueryVariables = Exact<{
  internalPolicyId: string
}>

export interface GetInternalPolicyDetailsByIdQuery {
  internalPolicy: {
    id: string
    name: string
    details: string | null
    createdAt: any
    createdBy: string | null
    updatedAt: any
    updatedBy: string | null
    tags: Array<string> | null
    revision: string | null
    status: Types.InternalPolicyDocumentStatus | null
    managementMode: Types.InternalPolicyDocumentManagementMode | null
    displayID: string
    reviewDue: any
    reviewFrequency: Types.InternalPolicyFrequency | null
    approvalRequired: boolean | null
    summary: string | null
    detailsJSON: Array<any> | null
    internalPolicyKindName: string | null
    liveExternalContents: string | null
    url: string | null
    externalFileID: string | null
    integrations: {
      edges: Array<{
        node: {
          id: string
          name: string
          kind: string | null
          integrationType: string | null
          description: string | null
          definitionID: string | null
          definitionSlug: string | null
          definitionVersion: string | null
          family: string | null
          environmentID: string | null
          environmentName: string | null
          scopeID: string | null
          scopeName: string | null
          platformID: string | null
          status: Types.IntegrationIntegrationStatus
          primaryDirectory: boolean
          campaignEmail: boolean
          systemOwned: boolean | null
          tags: Array<string> | null
          config: any
          metadata: any
          providerMetadataSnapshot: any
          webhookURLs: any
          ownerID: string | null
          createdAt: any
          createdBy: string | null
          updatedAt: any
          updatedBy: string | null
        } | null
      } | null> | null
    }
    file: { id: string; presignedURL: string | null; providedFileName: string; providedFileExtension: string; detectedMimeType: string | null } | null
    approver: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
    delegate: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
  }
}

export type GetInternalPolicyAssociationsByIdQueryVariables = Exact<{
  internalPolicyId: string
}>

export interface GetInternalPolicyAssociationsByIdQuery {
  internalPolicy: {
    procedures: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          name: string
          displayID: string
          summary: string | null
          procedureKindName: string | null
          status: Types.ProcedureDocumentStatus | null
          details: string | null
          detailsJSON: Array<any> | null
          approver: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
    controls: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; refCode: string; description: string | null } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; refCode: string; description: string | null; controlId: string } | null } | null> | null }
    programs: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; name: string; description: string | null } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; title: string; details: string | null } | null } | null> | null }
    controlObjectives: {
      totalCount: number
      edges: Array<{
        node: { id: string; displayID: string; name: string; desiredOutcome: string | null; controls: { edges: Array<{ node: { id: string } | null } | null> | null } } | null
      } | null> | null
    }
    risks: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; name: string } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    identityHolders: {
      totalCount: number
      edges: Array<{ node: { id: string; fullName: string; displayID: string; identityHolderType: Types.IdentityHolderIdentityHolderType; title: string | null } | null } | null> | null
    }
  }
}

export type CreateBulkCsvInternalPolicyMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvInternalPolicyMutation {
  createBulkCSVInternalPolicy: { internalPolicies: Array<{ id: string }> | null }
}

export type UpdateBulkInternalPolicyMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateInternalPolicyInput
}>

export interface UpdateBulkInternalPolicyMutation {
  updateBulkInternalPolicy: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type CreateUploadInternalPolicyMutationVariables = Exact<{
  internalPolicyFile: any
  managementMode?: Types.InternalPolicyDocumentManagementMode | null | undefined
}>

export interface CreateUploadInternalPolicyMutation {
  createUploadInternalPolicy: { internalPolicy: { fileID: string | null; id: string; managementMode: Types.InternalPolicyDocumentManagementMode | null } }
}

export type GetInternalPoliciesDashboardQueryVariables = Exact<{
  where?: Types.InternalPolicyWhereInput | null | undefined
}>

export interface GetInternalPoliciesDashboardQuery {
  internalPolicies: {
    edges: Array<{
      node: {
        id: string
        name: string
        internalPolicyKindName: string | null
        status: Types.InternalPolicyDocumentStatus | null
        createdAt: any
        updatedAt: any
        createdBy: string | null
        updatedBy: string | null
      } | null
    } | null> | null
  }
}

export type PolicySuggestedActionsQueryVariables = Exact<{
  currentUserIdID: string
  currentUserIdString: string
  sevenDaysAgo: any
  commentsSince: any
}>

export interface PolicySuggestedActionsQuery {
  needsMyApproval: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.InternalPolicyDocumentStatus | null; updatedAt: any } | null } | null> | null }
  missingApprover: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.InternalPolicyDocumentStatus | null; updatedAt: any } | null } | null> | null }
  stillDraftAfterWeek: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.InternalPolicyDocumentStatus | null; updatedAt: any } | null } | null> | null }
  recentComments: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.InternalPolicyDocumentStatus | null; updatedAt: any } | null } | null> | null }
}

export type DeleteBulkInternalPolicyMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkInternalPolicyMutation {
  deleteBulkInternalPolicy: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type PolicyDiscussionFieldsFragment = {
  __typename: 'InternalPolicy'
  id: string
  name: string
  discussions: {
    edges: Array<{
      node: {
        id: string
        externalID: string | null
        createdAt: any
        isResolved: boolean
        comments: {
          edges: Array<{
            node: {
              updatedBy: string | null
              updatedAt: any
              text: string
              noteRef: string | null
              isEdited: boolean
              id: string
              displayID: string
              discussionID: string | null
              createdAt: any
              createdBy: string | null
            } | null
          } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type GetPolicyDiscussionByIdQueryVariables = Exact<{
  policyId: string
}>

export interface GetPolicyDiscussionByIdQuery {
  internalPolicy: {
    __typename: 'InternalPolicy'
    id: string
    name: string
    discussions: {
      edges: Array<{
        node: {
          id: string
          externalID: string | null
          createdAt: any
          isResolved: boolean
          comments: {
            edges: Array<{
              node: {
                updatedBy: string | null
                updatedAt: any
                text: string
                noteRef: string | null
                isEdited: boolean
                id: string
                displayID: string
                discussionID: string | null
                createdAt: any
                createdBy: string | null
              } | null
            } | null> | null
          }
        } | null
      } | null> | null
    }
  }
}

export type InsertInternalPolicyCommentMutationVariables = Exact<{
  updateInternalPolicyId: string
  input: Types.UpdateInternalPolicyInput
}>

export interface InsertInternalPolicyCommentMutation {
  updateInternalPolicy: {
    internalPolicy: {
      discussions: {
        edges: Array<{
          node: {
            id: string
            externalID: string | null
            isResolved: boolean
            comments: { edges: Array<{ node: { text: string; isEdited: boolean; id: string; noteRef: string | null } | null } | null> | null }
          } | null
        } | null> | null
      }
    }
  }
}

export type UpdatePolicyCommentMutationVariables = Exact<{
  updateInternalPolicyCommentId: string
  input: Types.UpdateNoteInput
}>

export interface UpdatePolicyCommentMutation {
  updateInternalPolicyComment: { internalPolicy: { id: string } }
}

export type GetPolicyCommentsByIdQueryVariables = Exact<{
  policyId: string
}>

export interface GetPolicyCommentsByIdQuery {
  internalPolicy: { id: string; comments: { edges: Array<{ node: { id: string; createdAt: any; createdBy: string | null; text: string } | null } | null> | null } }
}

export type JobResultsWithFilterQueryVariables = Exact<{
  where?: Types.JobResultWhereInput | null | undefined
  orderBy?: Array<Types.JobResultOrder> | Types.JobResultOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface JobResultsWithFilterQuery {
  jobResults: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        exitCode: number
        fileID: string
        finishedAt: any
        id: string
        log: string | null
        scheduledJobID: string
        startedAt: any
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type JobResultQueryVariables = Exact<{
  jobResultId: string
}>

export interface JobResultQuery {
  jobResult: {
    createdAt: any
    createdBy: string | null
    exitCode: number
    fileID: string
    finishedAt: any
    id: string
    log: string | null
    scheduledJobID: string
    startedAt: any
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateJobResultMutationVariables = Exact<{
  input: Types.CreateJobResultInput
}>

export interface CreateJobResultMutation {
  createJobResult: { jobResult: { id: string } }
}

export type UpdateJobResultMutationVariables = Exact<{
  updateJobResultId: string
  input: Types.UpdateJobResultInput
}>

export interface UpdateJobResultMutation {
  updateJobResult: { jobResult: { id: string } }
}

export type DeleteJobResultMutationVariables = Exact<{
  deleteJobResultId: string
}>

export interface DeleteJobResultMutation {
  deleteJobResult: { deletedID: string }
}

export type JobRunnerRegistrationTokensWithFilterQueryVariables = Exact<{
  where?: Types.JobRunnerRegistrationTokenWhereInput | null | undefined
  orderBy?: Array<Types.JobRunnerRegistrationTokenOrder> | Types.JobRunnerRegistrationTokenOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface JobRunnerRegistrationTokensWithFilterQuery {
  jobRunnerRegistrationTokens: {
    totalCount: number
    edges: Array<{
      node: { createdAt: any; createdBy: string | null; expiresAt: any; id: string; jobRunnerID: string | null; lastUsedAt: any; token: string; updatedAt: any; updatedBy: string | null } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type JobRunnerRegistrationTokenQueryVariables = Exact<{
  jobRunnerRegistrationTokenId: string
}>

export interface JobRunnerRegistrationTokenQuery {
  jobRunnerRegistrationToken: {
    createdAt: any
    createdBy: string | null
    expiresAt: any
    id: string
    jobRunnerID: string | null
    lastUsedAt: any
    token: string
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateJobRunnerRegistrationTokenMutationVariables = Exact<{
  input: Types.CreateJobRunnerRegistrationTokenInput
}>

export interface CreateJobRunnerRegistrationTokenMutation {
  createJobRunnerRegistrationToken: { jobRunnerRegistrationToken: { id: string } }
}

export type DeleteJobRunnerRegistrationTokenMutationVariables = Exact<{
  deleteJobRunnerRegistrationTokenId: string
}>

export interface DeleteJobRunnerRegistrationTokenMutation {
  deleteJobRunnerRegistrationToken: { deletedID: string }
}

export type JobRunnersWithFilterQueryVariables = Exact<{
  where?: Types.JobRunnerWhereInput | null | undefined
  orderBy?: Array<Types.JobRunnerOrder> | Types.JobRunnerOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface JobRunnersWithFilterQuery {
  jobRunners: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        displayID: string
        id: string
        ipAddress: string | null
        lastSeen: any
        name: string
        os: string | null
        systemOwned: boolean | null
        updatedAt: any
        updatedBy: string | null
        version: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type JobRunnerQueryVariables = Exact<{
  jobRunnerId: string
}>

export interface JobRunnerQuery {
  jobRunner: {
    createdAt: any
    createdBy: string | null
    displayID: string
    id: string
    ipAddress: string | null
    lastSeen: any
    name: string
    os: string | null
    systemOwned: boolean | null
    updatedAt: any
    updatedBy: string | null
    version: string | null
  }
}

export type CreateJobRunnerMutationVariables = Exact<{
  input: Types.CreateJobRunnerInput
}>

export interface CreateJobRunnerMutation {
  createJobRunner: { jobRunner: { id: string } }
}

export type UpdateJobRunnerMutationVariables = Exact<{
  updateJobRunnerId: string
  input: Types.UpdateJobRunnerInput
}>

export interface UpdateJobRunnerMutation {
  updateJobRunner: { jobRunner: { id: string } }
}

export type DeleteJobRunnerMutationVariables = Exact<{
  deleteJobRunnerId: string
}>

export interface DeleteJobRunnerMutation {
  deleteJobRunner: { deletedID: string }
}

export type JobTemplatesWithFilterQueryVariables = Exact<{
  where?: Types.JobTemplateWhereInput | null | undefined
  orderBy?: Array<Types.JobTemplateOrder> | Types.JobTemplateOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface JobTemplatesWithFilterQuery {
  jobTemplates: {
    totalCount: number
    edges: Array<{
      node: {
        configuration: any
        createdAt: any
        createdBy: string | null
        cron: string | null
        description: string | null
        displayID: string
        downloadURL: string
        id: string
        systemOwned: boolean | null
        title: string
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type JobTemplateQueryVariables = Exact<{
  jobTemplateId: string
}>

export interface JobTemplateQuery {
  jobTemplate: {
    configuration: any
    createdAt: any
    createdBy: string | null
    cron: string | null
    description: string | null
    displayID: string
    downloadURL: string
    id: string
    systemOwned: boolean | null
    title: string
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateJobTemplateMutationVariables = Exact<{
  input: Types.CreateJobTemplateInput
}>

export interface CreateJobTemplateMutation {
  createJobTemplate: { jobTemplate: { id: string } }
}

export type UpdateJobTemplateMutationVariables = Exact<{
  updateJobTemplateId: string
  input: Types.UpdateJobTemplateInput
}>

export interface UpdateJobTemplateMutation {
  updateJobTemplate: { jobTemplate: { id: string } }
}

export type DeleteJobTemplateMutationVariables = Exact<{
  deleteJobTemplateId: string
}>

export interface DeleteJobTemplateMutation {
  deleteJobTemplate: { deletedID: string }
}

export type CreateBulkCsvJobTemplateMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvJobTemplateMutation {
  createBulkCSVJobTemplate: { jobTemplates: Array<{ id: string }> | null }
}

export type DeleteBulkJobTemplateMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkJobTemplateMutation {
  deleteBulkJobTemplate: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkJobTemplateMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateJobTemplateInput
}>

export interface UpdateBulkJobTemplateMutation {
  updateBulkJobTemplate: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type CreateMappedControlMutationVariables = Exact<{
  input: Types.CreateMappedControlInput
}>

export interface CreateMappedControlMutation {
  createMappedControl: { mappedControl: { id: string } }
}

export type MappedSubcontrolsFragmentFragment = {
  __typename: 'Subcontrol'
  id: string
  refCode: string
  referenceFramework: string | null
  controlID: string
  category: string | null
  subcategory: string | null
}

export type MappedControlsFragmentFragment = { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null; category: string | null; subcategory: string | null }

export type GetAllMappedControlsQueryVariables = Exact<{
  where?: Types.MappedControlWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
}>

export interface GetAllMappedControlsQuery {
  mappedControls: {
    pageInfo: { hasNextPage: boolean; endCursor: any }
    edges: Array<{
      node: {
        id: string
        relation: string | null
        confidence: number | null
        mappingType: Types.MappedControlMappingType
        source: Types.MappedControlMappingSource | null
        systemOwned: boolean | null
        fromSubcontrols: {
          edges: Array<{
            node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; controlID: string; category: string | null; subcategory: string | null } | null
          } | null> | null
        }
        toSubcontrols: {
          edges: Array<{
            node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; controlID: string; category: string | null; subcategory: string | null } | null
          } | null> | null
        }
        fromControls: {
          edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null; category: string | null; subcategory: string | null } | null } | null> | null
        }
        toControls: {
          edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null; category: string | null; subcategory: string | null } | null } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type GetMappedControlByIdQueryVariables = Exact<{
  mappedControlId: string
}>

export interface GetMappedControlByIdQuery {
  mappedControl: {
    id: string
    relation: string | null
    confidence: number | null
    mappingType: Types.MappedControlMappingType
    source: Types.MappedControlMappingSource | null
    fromSubcontrols: { edges: Array<{ node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; control: { id: string } } | null } | null> | null }
    toSubcontrols: { edges: Array<{ node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null; control: { id: string } } | null } | null> | null }
    fromControls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
    toControls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
  }
}

export type UpdateMappedControlMutationVariables = Exact<{
  updateMappedControlId: string
  input: Types.UpdateMappedControlInput
}>

export interface UpdateMappedControlMutation {
  updateMappedControl: { mappedControl: { id: string } }
}

export type DeleteMappedControlMutationVariables = Exact<{
  deleteMappedControlId: string
}>

export interface DeleteMappedControlMutation {
  deleteMappedControl: { deletedID: string }
}

export type UpdateUserRoleInOrgMutationVariables = Exact<{
  updateOrgMemberId: string
  input: Types.UpdateOrgMembershipInput
}>

export interface UpdateUserRoleInOrgMutation {
  updateOrgMembership: {
    orgMembership: {
      id: string
      role: Types.OrgMembershipRole
      userID: string
      organizationID: string
      ssoExempt: boolean | null
      ssoExemptReason: string | null
      tfaEnforced: boolean | null
      tfaEnforcedReason: string | null
    }
  }
}

export type RemoveUserFromOrgMutationVariables = Exact<{
  deleteOrgMembershipId: string
}>

export interface RemoveUserFromOrgMutation {
  deleteOrgMembership: { deletedID: string }
}

export type OrgMembershipsQueryVariables = Exact<{
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  where?: Types.OrgMembershipWhereInput | null | undefined
  orderBy?: Array<Types.OrgMembershipOrder> | Types.OrgMembershipOrder | null | undefined
}>

export interface OrgMembershipsQuery {
  orgMemberships: {
    totalCount: number
    pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
    edges: Array<{
      node: {
        id: string
        createdAt: any
        role: Types.OrgMembershipRole
        additionalRoles: Array<string> | null
        ssoExempt: boolean | null
        ssoExemptReason: string | null
        tfaEnforced: boolean | null
        tfaEnforcedReason: string | null
        user: {
          id: string
          displayName: string
          authProvider: Types.UserAuthProvider
          avatarRemoteURL: string | null
          email: string
          role: Types.UserRole | null
          createdAt: any
          avatarFile: { id: string; base64: string | null } | null
        }
      } | null
    } | null> | null
  }
}

export type OrgMembershipsByIdsQueryVariables = Exact<{
  where?: Types.OrgMembershipWhereInput | null | undefined
}>

export interface OrgMembershipsByIdsQuery {
  orgMemberships: { edges: Array<{ node: { user: { id: string; displayName: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null } } | null } | null> | null }
}

export type NarrativesWithFilterQueryVariables = Exact<{
  where?: Types.NarrativeWhereInput | null | undefined
  orderBy?: Array<Types.NarrativeOrder> | Types.NarrativeOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface NarrativesWithFilterQuery {
  narratives: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        description: string | null
        details: string | null
        displayID: string
        id: string
        name: string
        systemOwned: boolean | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type NotificationPreferencesWithFilterQueryVariables = Exact<{
  where?: Types.NotificationPreferenceWhereInput | null | undefined
  orderBy?: Array<Types.NotificationPreferenceOrder> | Types.NotificationPreferenceOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface NotificationPreferencesWithFilterQuery {
  notificationPreferences: {
    totalCount: number
    edges: Array<{
      node: {
        config: any
        createdAt: any
        createdBy: string | null
        destination: string | null
        enabled: boolean
        id: string
        isDefault: boolean
        lastError: string | null
        lastUsedAt: any
        metadata: any
        muteUntil: any
        provider: string | null
        quietHoursEnd: string | null
        quietHoursStart: string | null
        templateID: string | null
        timezone: string | null
        topicOverrides: any
        updatedAt: any
        updatedBy: string | null
        userID: string
        verifiedAt: any
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type NotificationPreferenceQueryVariables = Exact<{
  notificationPreferenceId: string
}>

export interface NotificationPreferenceQuery {
  notificationPreference: {
    config: any
    createdAt: any
    createdBy: string | null
    destination: string | null
    enabled: boolean
    id: string
    isDefault: boolean
    lastError: string | null
    lastUsedAt: any
    metadata: any
    muteUntil: any
    provider: string | null
    quietHoursEnd: string | null
    quietHoursStart: string | null
    templateID: string | null
    timezone: string | null
    topicOverrides: any
    updatedAt: any
    updatedBy: string | null
    userID: string
    verifiedAt: any
  }
}

export type CreateNotificationPreferenceMutationVariables = Exact<{
  input: Types.CreateNotificationPreferenceInput
}>

export interface CreateNotificationPreferenceMutation {
  createNotificationPreference: { notificationPreference: { id: string } }
}

export type UpdateNotificationPreferenceMutationVariables = Exact<{
  updateNotificationPreferenceId: string
  input: Types.UpdateNotificationPreferenceInput
}>

export interface UpdateNotificationPreferenceMutation {
  updateNotificationPreference: { notificationPreference: { id: string } }
}

export type DeleteNotificationPreferenceMutationVariables = Exact<{
  deleteNotificationPreferenceId: string
}>

export interface DeleteNotificationPreferenceMutation {
  deleteNotificationPreference: { deletedID: string }
}

export type CreateBulkCsvNotificationPreferenceMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvNotificationPreferenceMutation {
  createBulkCSVNotificationPreference: { notificationPreferences: Array<{ id: string }> | null }
}

export type DeleteBulkNotificationPreferenceMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkNotificationPreferenceMutation {
  deleteBulkNotificationPreference: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkNotificationPreferenceMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateNotificationPreferenceInput
}>

export interface UpdateBulkNotificationPreferenceMutation {
  updateBulkNotificationPreference: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type NotificationTemplatesWithFilterQueryVariables = Exact<{
  where?: Types.NotificationTemplateWhereInput | null | undefined
  orderBy?: Array<Types.NotificationTemplateOrder> | Types.NotificationTemplateOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface NotificationTemplatesWithFilterQuery {
  notificationTemplates: {
    totalCount: number
    edges: Array<{
      node: {
        active: boolean
        blocks: any
        bodyTemplate: string | null
        createdAt: any
        createdBy: string | null
        description: string | null
        emailTemplateID: string | null
        id: string
        integrationID: string | null
        jsonconfig: any
        key: string
        locale: string
        metadata: any
        name: string
        subjectTemplate: string | null
        systemOwned: boolean | null
        titleTemplate: string | null
        channel: Types.NotificationTemplateChannel | null
        destinations: Array<string> | null
        format: Types.NotificationTemplateNotificationTemplateFormat
        topicPattern: string
        uischema: any
        updatedAt: any
        updatedBy: string | null
        version: number
        workflowDefinitionID: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type NotificationTemplateQueryVariables = Exact<{
  notificationTemplateId: string
}>

export interface NotificationTemplateQuery {
  notificationTemplate: {
    active: boolean
    blocks: any
    bodyTemplate: string | null
    createdAt: any
    createdBy: string | null
    description: string | null
    emailTemplateID: string | null
    id: string
    integrationID: string | null
    jsonconfig: any
    key: string
    locale: string
    metadata: any
    name: string
    subjectTemplate: string | null
    systemOwned: boolean | null
    titleTemplate: string | null
    channel: Types.NotificationTemplateChannel | null
    destinations: Array<string> | null
    format: Types.NotificationTemplateNotificationTemplateFormat
    topicPattern: string
    uischema: any
    updatedAt: any
    updatedBy: string | null
    version: number
    workflowDefinitionID: string | null
  }
}

export type CreateNotificationTemplateMutationVariables = Exact<{
  input: Types.CreateNotificationTemplateInput
}>

export interface CreateNotificationTemplateMutation {
  createNotificationTemplate: { notificationTemplate: { id: string } }
}

export type UpdateNotificationTemplateMutationVariables = Exact<{
  updateNotificationTemplateId: string
  input: Types.UpdateNotificationTemplateInput
}>

export interface UpdateNotificationTemplateMutation {
  updateNotificationTemplate: { notificationTemplate: { id: string } }
}

export type DeleteNotificationTemplateMutationVariables = Exact<{
  deleteNotificationTemplateId: string
}>

export interface DeleteNotificationTemplateMutation {
  deleteNotificationTemplate: { deletedID: string }
}

export type CreateBulkCsvNotificationTemplateMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvNotificationTemplateMutation {
  createBulkCSVNotificationTemplate: { notificationTemplates: Array<{ id: string }> | null }
}

export type DeleteBulkNotificationTemplateMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkNotificationTemplateMutation {
  deleteBulkNotificationTemplate: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkNotificationTemplateMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateNotificationTemplateInput
}>

export interface UpdateBulkNotificationTemplateMutation {
  updateBulkNotificationTemplate: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type MarkNotificationsAsReadMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface MarkNotificationsAsReadMutation {
  markNotificationsAsRead: { readIDs: Array<string | null> }
}

export type CreateOnboardingMutationVariables = Exact<{
  input: Types.CreateOnboardingInput
}>

export interface CreateOnboardingMutation {
  createOnboarding: { onboarding: { companyDetails: any; companyName: string; domains: Array<string> | null; compliance: any; id: string; organizationID: string | null; userDetails: any } }
}

export type GetAllOrganizationsQueryVariables = Exact<{ [key: string]: never }>

export interface GetAllOrganizationsQuery {
  organizations: {
    edges: Array<{
      node: {
        id: string
        name: string
        displayName: string
        avatarRemoteURL: string | null
        personalOrg: boolean | null
        stripeCustomerID: string | null
        avatarFile: { id: string; base64: string | null } | null
        setting: { identityProviderLoginEnforced: boolean } | null
      } | null
    } | null> | null
  }
}

export type GetOrganizationNameByIdQueryVariables = Exact<{
  organizationId: string
}>

export interface GetOrganizationNameByIdQuery {
  organization: { name: string; displayName: string }
}

export type GetSingleOrganizationMembersQueryVariables = Exact<{
  organizationId: string
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetSingleOrganizationMembersQuery {
  organization: {
    members: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          createdAt: any
          role: Types.OrgMembershipRole
          user: {
            id: string
            displayName: string
            authProvider: Types.UserAuthProvider
            avatarRemoteURL: string | null
            email: string
            role: Types.UserRole | null
            createdAt: any
            avatarFile: { id: string; base64: string | null } | null
          }
        } | null
      } | null> | null
      pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
    }
  }
}

export type GetAllOrganizationsWithMembersQueryVariables = Exact<{
  membersWhere?: Types.OrgMembershipWhereInput | null | undefined
}>

export interface GetAllOrganizationsWithMembersQuery {
  organizations: {
    edges: Array<{
      node: {
        id: string
        personalOrg: boolean | null
        displayName: string
        name: string
        avatarRemoteURL: string | null
        avatarFile: { id: string; base64: string | null } | null
        members: { edges: Array<{ node: { id: string; role: Types.OrgMembershipRole; user: { id: string } } | null } | null> | null }
      } | null
    } | null> | null
  }
}

export type GetInvitesQueryVariables = Exact<{
  where?: Types.InviteWhereInput | null | undefined
  orderBy?: Array<Types.InviteOrder> | Types.InviteOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetInvitesQuery {
  invites: {
    totalCount: number
    edges: Array<{ node: { id: string; recipient: string; status: Types.InviteInviteStatus; createdAt: any; expires: any; role: Types.InviteRole; sendAttempts: number } | null } | null> | null
    pageInfo: { startCursor: any; endCursor: any }
  }
}

export type GetOrganizationBillingQueryVariables = Exact<{
  organizationId: string
}>

export interface GetOrganizationBillingQuery {
  organization: { personalOrg: boolean | null; orgSubscriptions: Array<{ active: boolean; expiresAt: any; stripeSubscriptionStatus: string | null; trialExpiresAt: any }> | null }
}

export type GetOrganizationBillingBannerQueryVariables = Exact<{
  organizationId: string
}>

export interface GetOrganizationBillingBannerQuery {
  organization: { personalOrg: boolean | null; orgSubscriptions: Array<{ trialExpiresAt: any; expiresAt: any; stripeSubscriptionStatus: string | null }> | null }
}

export type GetOrganizationSettingQueryVariables = Exact<{
  organizationId: string
}>

export interface GetOrganizationSettingQuery {
  organization: {
    slugName: string | null
    setting: {
      id: string
      createdAt: any
      updatedAt: any
      createdBy: string | null
      updatedBy: string | null
      domains: Array<string> | null
      billingContact: string | null
      billingEmail: string | null
      billingPhone: string | null
      billingAddress: any
      taxIdentifier: string | null
      tags: Array<string> | null
      geoLocation: Types.OrganizationSettingRegion | null
      billingNotificationsEnabled: boolean
      allowedEmailDomains: Array<string> | null
      ssoExemptDomains: Array<string> | null
      allowSupportAccess: boolean | null
      identityProvider: Types.OrganizationSettingSsoProvider | null
      identityProviderClientID: string | null
      identityProviderClientSecret: string | null
      oidcDiscoveryEndpoint: string | null
      identityProviderLoginEnforced: boolean
      identityProviderAuthTested: boolean
      identityProviderJitProvisioning: boolean
      jitAllowedEmailDomains: Array<string> | null
      allowMatchingDomainsAutojoin: boolean | null
    } | null
  }
}

export type GetBillingEmailQueryVariables = Exact<{
  organizationId: string
}>

export interface GetBillingEmailQuery {
  organization: { setting: { billingEmail: string | null } | null }
}

export type CreateOrganizationMutationVariables = Exact<{
  input: Types.CreateOrganizationInput
}>

export interface CreateOrganizationMutation {
  createOrganization: { organization: { id: string } }
}

export type UpdateOrganizationMutationVariables = Exact<{
  updateOrganizationId: string
  input: Types.UpdateOrganizationInput
  avatarFile?: any
}>

export interface UpdateOrganizationMutation {
  updateOrganization: { organization: { id: string } }
}

export type CreateBulkInviteMutationVariables = Exact<{
  input?: Array<Types.CreateInviteInput> | Types.CreateInviteInput | null | undefined
}>

export interface CreateBulkInviteMutation {
  createBulkInvite: { invites: Array<{ id: string }> | null }
}

export type DeleteOrganizationInviteMutationVariables = Exact<{
  deleteInviteId: string
}>

export interface DeleteOrganizationInviteMutation {
  deleteInvite: { deletedID: string }
}

export type DeleteOrganizationMutationVariables = Exact<{
  deleteOrganizationId: string
}>

export interface DeleteOrganizationMutation {
  deleteOrganization: { deletedID: string }
}

export type LeaveOrganizationMutationVariables = Exact<{
  organizationID: string
}>

export interface LeaveOrganizationMutation {
  leaveOrganization: { deletedID: string }
}

export type UpdateOrganizationSettingMutationVariables = Exact<{
  updateOrganizationSettingId: string
  input: Types.UpdateOrganizationSettingInput
}>

export interface UpdateOrganizationSettingMutation {
  updateOrganizationSetting: { organizationSetting: { id: string } }
}

export type TransferOrganizationOwnershipMutationVariables = Exact<{
  newOwnerEmail: string
}>

export interface TransferOrganizationOwnershipMutation {
  transferOrganizationOwnership: { invitationSent: boolean }
}

export type GetPasskeysQueryVariables = Exact<{ [key: string]: never }>

export interface GetPasskeysQuery {
  webauthns: { edges: Array<{ node: { id: string; backupState: boolean; backupEligible: boolean; createdAt: any; tags: Array<string> | null; aaguid: any } | null } | null> | null }
}

export type DeletePasskeyMutationVariables = Exact<{
  deleteWebauthnId: string
}>

export interface DeletePasskeyMutation {
  deleteWebauthn: { deletedID: string }
}

export type PlatformsWithFilterQueryVariables = Exact<{
  where?: Types.PlatformWhereInput | null | undefined
  orderBy?: Array<Types.PlatformOrder> | Types.PlatformOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface PlatformsWithFilterQuery {
  platforms: {
    totalCount: number
    edges: Array<{
      node: {
        accessModelID: string | null
        accessModelName: string | null
        businessOwner: string | null
        businessOwnerGroupID: string | null
        businessOwnerUserID: string | null
        businessPurpose: string | null
        containsPii: boolean | null
        costCenter: string | null
        createdAt: any
        createdBy: string | null
        criticalityID: string | null
        criticalityName: string | null
        dataFlowSummary: string | null
        description: string | null
        displayID: string
        encryptionStatusID: string | null
        encryptionStatusName: string | null
        environmentID: string | null
        environmentName: string | null
        estimatedMonthlyCost: number | null
        externalReferenceID: string | null
        hasPendingWorkflow: boolean
        hasWorkflowHistory: boolean
        id: string
        internalOwner: string | null
        internalOwnerGroupID: string | null
        internalOwnerUserID: string | null
        metadata: any
        name: string
        physicalLocation: string | null
        platformDataClassificationID: string | null
        platformDataClassificationName: string | null
        platformKindID: string | null
        platformKindName: string | null
        platformOwnerID: string | null
        purchaseDate: string | null
        region: string | null
        scopeID: string | null
        scopeName: string | null
        scopeStatement: string | null
        securityOwner: string | null
        securityOwnerGroupID: string | null
        securityOwnerUserID: string | null
        securityTierID: string | null
        securityTierName: string | null
        sourceIdentifier: string | null
        status: Types.PlatformPlatformStatus
        technicalOwner: string | null
        technicalOwnerGroupID: string | null
        technicalOwnerUserID: string | null
        trustBoundaryDescription: string | null
        updatedAt: any
        updatedBy: string | null
        workflowEligibleMarker: boolean | null
        businessOwnerUser: { id: string; displayName: string; email: string } | null
        businessOwnerGroup: { id: string; name: string } | null
        technicalOwnerUser: { id: string; displayName: string; email: string } | null
        technicalOwnerGroup: { id: string; name: string } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetPlatformByIdMinifiedQueryVariables = Exact<{
  platformId: string
}>

export interface GetPlatformByIdMinifiedQuery {
  platform: { id: string; name: string; displayID: string }
}

export type PlatformQueryVariables = Exact<{
  platformId: string
}>

export interface PlatformQuery {
  platform: {
    accessModelID: string | null
    accessModelName: string | null
    businessOwner: string | null
    businessOwnerGroupID: string | null
    businessOwnerUserID: string | null
    businessPurpose: string | null
    containsPii: boolean | null
    costCenter: string | null
    createdAt: any
    createdBy: string | null
    criticalityID: string | null
    criticalityName: string | null
    dataFlowSummary: string | null
    description: string | null
    displayID: string
    encryptionStatusID: string | null
    encryptionStatusName: string | null
    environmentID: string | null
    environmentName: string | null
    estimatedMonthlyCost: number | null
    externalReferenceID: string | null
    hasPendingWorkflow: boolean
    hasWorkflowHistory: boolean
    id: string
    internalOwner: string | null
    internalOwnerGroupID: string | null
    internalOwnerUserID: string | null
    metadata: any
    name: string
    physicalLocation: string | null
    platformDataClassificationID: string | null
    platformDataClassificationName: string | null
    platformKindID: string | null
    platformKindName: string | null
    platformOwnerID: string | null
    purchaseDate: string | null
    region: string | null
    scopeID: string | null
    scopeName: string | null
    scopeStatement: string | null
    securityOwner: string | null
    securityOwnerGroupID: string | null
    securityOwnerUserID: string | null
    securityTierID: string | null
    securityTierName: string | null
    sourceIdentifier: string | null
    status: Types.PlatformPlatformStatus
    technicalOwner: string | null
    technicalOwnerGroupID: string | null
    technicalOwnerUserID: string | null
    trustBoundaryDescription: string | null
    updatedAt: any
    updatedBy: string | null
    workflowEligibleMarker: boolean | null
    businessOwnerUser: { id: string; displayName: string; email: string } | null
    businessOwnerGroup: { id: string; name: string } | null
    internalOwnerUser: { id: string; displayName: string; email: string } | null
    internalOwnerGroup: { id: string; name: string } | null
    platformOwner: { id: string; displayName: string; email: string } | null
    securityOwnerUser: { id: string; displayName: string; email: string } | null
    securityOwnerGroup: { id: string; name: string } | null
    technicalOwnerUser: { id: string; displayName: string; email: string } | null
    technicalOwnerGroup: { id: string; name: string } | null
    assets: {
      edges: Array<{
        node: {
          id: string
          name: string
          assetType: Types.AssetAssetType
          internalOwner: string | null
          internalOwnerUser: { id: string; displayName: string; email: string } | null
          internalOwnerGroup: { id: string; displayName: string } | null
        } | null
      } | null> | null
    }
    outOfScopeAssets: {
      edges: Array<{
        node: {
          id: string
          name: string
          assetType: Types.AssetAssetType
          internalOwner: string | null
          internalOwnerUser: { id: string; displayName: string; email: string } | null
          internalOwnerGroup: { id: string; displayName: string } | null
        } | null
      } | null> | null
    }
    entities: {
      edges: Array<{
        node: {
          id: string
          name: string | null
          displayName: string | null
          status: Types.EntityEntityStatus | null
          internalOwner: string | null
          logoFile: { base64: string | null } | null
          internalOwnerUser: { id: string; displayName: string; email: string } | null
          internalOwnerGroup: { id: string; displayName: string } | null
        } | null
      } | null> | null
    }
    outOfScopeVendors: {
      edges: Array<{
        node: {
          id: string
          name: string | null
          displayName: string | null
          status: Types.EntityEntityStatus | null
          internalOwner: string | null
          logoFile: { base64: string | null } | null
          internalOwnerUser: { id: string; displayName: string; email: string } | null
          internalOwnerGroup: { id: string; displayName: string } | null
        } | null
      } | null> | null
    }
    architectureDiagrams: { edges: Array<{ node: { id: string; providedFileName: string; presignedURL: string | null } | null } | null> | null }
    dataFlowDiagrams: { edges: Array<{ node: { id: string; providedFileName: string; presignedURL: string | null } | null } | null> | null }
    trustBoundaryDiagrams: { edges: Array<{ node: { id: string; providedFileName: string; base64: string | null } | null } | null> | null }
  }
}

export type CreatePlatformMutationVariables = Exact<{
  input: Types.CreatePlatformInput
}>

export interface CreatePlatformMutation {
  createPlatform: { platform: { id: string } }
}

export type UpdatePlatformMutationVariables = Exact<{
  updatePlatformId: string
  input: Types.UpdatePlatformInput
  architectureDiagrams?: Array<any> | any | null | undefined
  dataFlowDiagrams?: Array<any> | any | null | undefined
  trustBoundaryDiagrams?: Array<any> | any | null | undefined
}>

export interface UpdatePlatformMutation {
  updatePlatform: { platform: { id: string } }
}

export type DeletePlatformMutationVariables = Exact<{
  deletePlatformId: string
}>

export interface DeletePlatformMutation {
  deletePlatform: { deletedID: string }
}

export type CreateProcedureMutationVariables = Exact<{
  input: Types.CreateProcedureInput
}>

export interface CreateProcedureMutation {
  createProcedure: { procedure: { id: string; name: string } }
}

export type UpdateProcedureMutationVariables = Exact<{
  updateProcedureId: string
  input: Types.UpdateProcedureInput
}>

export interface UpdateProcedureMutation {
  updateProcedure: { procedure: { id: string; name: string; procedureKindName: string | null } }
}

export type UpdateBulkProcedureMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateProcedureInput
}>

export interface UpdateBulkProcedureMutation {
  updateBulkProcedure: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetAllProceduresWithDetailsQueryVariables = Exact<{ [key: string]: never }>

export interface GetAllProceduresWithDetailsQuery {
  procedures: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        status: Types.ProcedureDocumentStatus | null
        revision: string | null
        updatedAt: any
        updatedBy: string | null
        createdAt: any
        createdBy: string | null
        tags: Array<string> | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetProceduresTableListQueryVariables = Exact<{
  orderBy?: Array<Types.ProcedureOrder> | Types.ProcedureOrder | null | undefined
  where?: Types.ProcedureWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetProceduresTableListQuery {
  procedures: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        updatedAt: any
        updatedBy: string | null
        createdAt: any
        createdBy: string | null
        summary: string | null
        approvalRequired: boolean | null
        procedureKindName: string | null
        reviewDue: any
        reviewFrequency: Types.ProcedureFrequency | null
        revision: string | null
        status: Types.ProcedureDocumentStatus | null
        tags: Array<string> | null
        approver: { displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
        delegate: { displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
        internalPolicies: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
        controls: { edges: Array<{ node: { id: string; refCode: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetProceduresListQueryVariables = Exact<{
  orderBy?: Array<Types.ProcedureOrder> | Types.ProcedureOrder | null | undefined
  where?: Types.ProcedureWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetProceduresListQuery {
  procedures: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        displayID: string
        status: Types.ProcedureDocumentStatus | null
        revision: string | null
        updatedAt: any
        updatedBy: string | null
        createdAt: any
        createdBy: string | null
        tags: Array<string> | null
        details: string | null
        summary: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type ProcedureByIdFragment = {
  id: string
  name: string
  details: string | null
  createdAt: any
  createdBy: string | null
  updatedAt: any
  updatedBy: string | null
  tags: Array<string> | null
  revision: string | null
  status: Types.ProcedureDocumentStatus | null
  displayID: string
  reviewDue: any
  reviewFrequency: Types.ProcedureFrequency | null
  approvalRequired: boolean | null
  procedureKindName: string | null
  detailsJSON: Array<any> | null
  approver: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
  delegate: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
}

export type GetProcedureAssociationsByIdQueryVariables = Exact<{
  procedureId: string
}>

export interface GetProcedureAssociationsByIdQuery {
  procedure: {
    risks: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string; details: string | null } | null } | null> | null }
    internalPolicies: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string; summary: string | null } | null } | null> | null }
    controls: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; refCode: string; description: string | null } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; refCode: string; description: string | null; control: { id: string } } | null } | null> | null }
    programs: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; name: string; description: string | null } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; title: string; details: string | null } | null } | null> | null }
  }
}

export type GetProcedureByIdMinifiedQueryVariables = Exact<{
  procedureId: string
}>

export interface GetProcedureByIdMinifiedQuery {
  procedure: { id: string; name: string }
}

export type GetProcedureDetailsByIdQueryVariables = Exact<{
  procedureId: string
}>

export interface GetProcedureDetailsByIdQuery {
  procedure: {
    id: string
    name: string
    details: string | null
    createdAt: any
    createdBy: string | null
    updatedAt: any
    updatedBy: string | null
    tags: Array<string> | null
    revision: string | null
    status: Types.ProcedureDocumentStatus | null
    displayID: string
    reviewDue: any
    reviewFrequency: Types.ProcedureFrequency | null
    approvalRequired: boolean | null
    procedureKindName: string | null
    detailsJSON: Array<any> | null
    approver: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
    delegate: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
  }
}

export type DeleteProcedureMutationVariables = Exact<{
  deleteProcedureId: string
}>

export interface DeleteProcedureMutation {
  deleteProcedure: { deletedID: string }
}

export type CreateBulkCsvProcedureMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvProcedureMutation {
  createBulkCSVProcedure: { procedures: Array<{ id: string }> | null }
}

export type CreateUploadProcedureMutationVariables = Exact<{
  procedureFile: any
}>

export interface CreateUploadProcedureMutation {
  createUploadProcedure: { procedure: { fileID: string | null; id: string } }
}

export type DeleteBulkProcedureMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkProcedureMutation {
  deleteBulkProcedure: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type ProcedureDiscussionFieldsFragment = {
  __typename: 'Procedure'
  id: string
  name: string
  discussions: {
    edges: Array<{
      node: {
        id: string
        externalID: string | null
        createdAt: any
        isResolved: boolean
        comments: {
          edges: Array<{
            node: {
              updatedBy: string | null
              updatedAt: any
              text: string
              noteRef: string | null
              isEdited: boolean
              id: string
              displayID: string
              discussionID: string | null
              createdAt: any
              createdBy: string | null
            } | null
          } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type GetProcedureDiscussionByIdQueryVariables = Exact<{
  procedureId: string
}>

export interface GetProcedureDiscussionByIdQuery {
  procedure: {
    __typename: 'Procedure'
    id: string
    name: string
    discussions: {
      edges: Array<{
        node: {
          id: string
          externalID: string | null
          createdAt: any
          isResolved: boolean
          comments: {
            edges: Array<{
              node: {
                updatedBy: string | null
                updatedAt: any
                text: string
                noteRef: string | null
                isEdited: boolean
                id: string
                displayID: string
                discussionID: string | null
                createdAt: any
                createdBy: string | null
              } | null
            } | null> | null
          }
        } | null
      } | null> | null
    }
  }
}

export type InsertProcedureCommentMutationVariables = Exact<{
  updateProcedureId: string
  input: Types.UpdateProcedureInput
}>

export interface InsertProcedureCommentMutation {
  updateProcedure: {
    procedure: {
      discussions: {
        edges: Array<{
          node: {
            id: string
            externalID: string | null
            isResolved: boolean
            comments: { edges: Array<{ node: { text: string; isEdited: boolean; id: string; noteRef: string | null } | null } | null> | null }
          } | null
        } | null> | null
      }
    }
  }
}

export type UpdateProcedureCommentMutationVariables = Exact<{
  updateProcedureCommentId: string
  input: Types.UpdateNoteInput
}>

export interface UpdateProcedureCommentMutation {
  updateProcedureComment: { procedure: { id: string } }
}

export type GetProcedureCommentsByIdQueryVariables = Exact<{
  procedureId: string
}>

export interface GetProcedureCommentsByIdQuery {
  procedure: { id: string; comments: { edges: Array<{ node: { id: string; createdAt: any; createdBy: string | null; text: string } | null } | null> | null } }
}

export type CreateProgramWithMembersMutationVariables = Exact<{
  input: Types.CreateProgramWithMembersInput
}>

export interface CreateProgramWithMembersMutation {
  createProgramWithMembers: { program: { id: string; name: string } }
}

export type UpdateProgramMutationVariables = Exact<{
  updateProgramId: string
  input: Types.UpdateProgramInput
}>

export interface UpdateProgramMutation {
  updateProgram: { program: { id: string; name: string } }
}

export type GetAllProgramsQueryVariables = Exact<{
  where?: Types.ProgramWhereInput | null | undefined
  orderBy?: Array<Types.ProgramOrder> | Types.ProgramOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllProgramsQuery {
  programs: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        description: string | null
        tags: Array<string> | null
        status: Types.ProgramProgramStatus
        startDate: any
        endDate: any
        auditorReady: boolean
        displayID: string
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetProgramEdgesForWizardQueryVariables = Exact<{ [key: string]: never }>

export interface GetProgramEdgesForWizardQuery {
  risks: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  procedures: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  internalPolicies: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  groups: { edges: Array<{ node: { id: string; name: string; displayName: string } | null } | null> | null }
  orgMemberships: { edges: Array<{ node: { user: { id: string; role: Types.UserRole | null; displayName: string } } | null } | null> | null }
}

export type GetProgramDetailsByIdQueryVariables = Exact<{
  programId: string
}>

export interface GetProgramDetailsByIdQuery {
  program: {
    id: string
    name: string
    description: string | null
    tags: Array<string> | null
    status: Types.ProgramProgramStatus
    startDate: any
    endDate: any
    auditorReady: boolean
    auditorWriteComments: boolean
    auditorReadComments: boolean
    tasks: {
      edges: Array<{
        node: {
          id: string
          title: string
          status: Types.TaskTaskStatus
          due: string | null
          details: string | null
          assignee: { displayName: string; id: string; email: string } | null
          assigner: { displayName: string; id: string; email: string } | null
        } | null
      } | null> | null
    }
    controlObjectives: {
      edges: Array<{ node: { id: string; name: string; desiredOutcome: string | null; controls: { edges: Array<{ node: { id: string } | null } | null> | null } } | null } | null> | null
    }
    controls: { edges: Array<{ node: { id: string } | null } | null> | null }
    subcontrols: { edges: Array<{ node: { id: string } | null } | null> | null }
    narratives: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
    internalPolicies: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
    procedures: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  }
}

export type GetProgramBasicInfoQueryVariables = Exact<{
  programId: string
}>

export interface GetProgramBasicInfoQuery {
  program: {
    name: string
    startDate: any
    endDate: any
    description: string | null
    auditFirm: string | null
    auditor: string | null
    auditorEmail: string | null
    auditorReady: boolean
    displayID: string
    tags: Array<string> | null
    frameworkName: string | null
    status: Types.ProgramProgramStatus
    programKindName: string | null
    programOwnerID: string | null
  }
}

export type GetProgramSettingsQueryVariables = Exact<{
  programId: string
}>

export interface GetProgramSettingsQuery {
  program: {
    viewers: { edges: Array<{ node: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null } | null> | null }
    editors: { edges: Array<{ node: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null } | null> | null }
    members: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          role: Types.ProgramMembershipRole
          user: { email: string; id: string; displayName: string; avatarRemoteURL: string | null; avatarFile: { id: string; base64: string | null } | null }
        } | null
      } | null> | null
    }
  }
}

export type GetProgramMembersQueryVariables = Exact<{
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  where?: Types.ProgramMembershipWhereInput | null | undefined
}>

export interface GetProgramMembersQuery {
  programMemberships: {
    totalCount: number
    pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
    edges: Array<{
      node: {
        id: string
        role: Types.ProgramMembershipRole
        user: { id: string; displayName: string; email: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null }
      } | null
    } | null> | null
  }
}

export type GetProgramGroupsQueryVariables = Exact<{
  programId: string
}>

export interface GetProgramGroupsQuery {
  program: {
    id: string
    viewers: {
      totalCount: number
      edges: Array<{
        node: {
          name: string
          displayName: string
          id: string
          gravatarLogoURL: string | null
          logoURL: string | null
          avatarFile: { base64: string | null } | null
          members: { totalCount: number }
        } | null
      } | null> | null
    }
    editors: {
      totalCount: number
      edges: Array<{
        node: {
          name: string
          displayName: string
          id: string
          gravatarLogoURL: string | null
          logoURL: string | null
          avatarFile: { base64: string | null } | null
          members: { totalCount: number }
        } | null
      } | null> | null
    }
  }
}

export type DeleteProgramMutationVariables = Exact<{
  deleteProgramId: string
}>

export interface DeleteProgramMutation {
  deleteProgram: { deletedID: string }
}

export type UpdateProgramMembershipMutationVariables = Exact<{
  updateProgramMembershipId: string
  input: Types.UpdateProgramMembershipInput
}>

export interface UpdateProgramMembershipMutation {
  updateProgramMembership: { programMembership: { id: string } }
}

export type GetEvidenceStatsQueryVariables = Exact<{
  programId: string
}>

export interface GetEvidenceStatsQuery {
  totalControls: { totalCount: number }
  frameworkControls: { totalCount: number }
  organizationControls: { totalCount: number }
  submitted: { totalCount: number }
  accepted: { totalCount: number }
  rejected: { totalCount: number }
}

export type GetProgramDashboardQueryVariables = Exact<{
  where?: Types.ProgramWhereInput | null | undefined
}>

export interface GetProgramDashboardQuery {
  programs: {
    edges: Array<{
      node: {
        id: string
        name: string
        frameworkName: string | null
        description: string | null
        status: Types.ProgramProgramStatus
        endDate: any
        startDate: any
        programOwner: { id: string; displayName: string } | null
        submittedEvidences: { totalCount: number }
        tasks: { edges: Array<{ node: { id: string; status: Types.TaskTaskStatus } | null } | null> | null }
        controls: { totalCount: number }
      } | null
    } | null> | null
  }
}

export type RemediationsWithFilterQueryVariables = Exact<{
  where?: Types.RemediationWhereInput | null | undefined
  orderBy?: Array<Types.RemediationOrder> | Types.RemediationOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface RemediationsWithFilterQuery {
  remediations: {
    totalCount: number
    edges: Array<{
      node: {
        completedAt: string | null
        createdAt: any
        createdBy: string | null
        displayID: string
        dueAt: string | null
        environmentID: string | null
        environmentName: string | null
        error: string | null
        explanation: string | null
        externalID: string | null
        externalOwnerID: string | null
        externalURI: string | null
        id: string
        instructions: string | null
        intent: string | null
        metadata: any
        ownerReference: string | null
        prGeneratedAt: string | null
        pullRequestURI: string | null
        repositoryURI: string | null
        scopeID: string | null
        scopeName: string | null
        source: string | null
        state: string | null
        summary: string | null
        systemOwned: boolean | null
        ticketReference: string | null
        title: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type RemediationQueryVariables = Exact<{
  remediationId: string
}>

export interface RemediationQuery {
  remediation: {
    completedAt: string | null
    createdAt: any
    createdBy: string | null
    displayID: string
    dueAt: string | null
    environmentID: string | null
    environmentName: string | null
    error: string | null
    explanation: string | null
    externalID: string | null
    externalOwnerID: string | null
    externalURI: string | null
    id: string
    instructions: string | null
    intent: string | null
    metadata: any
    ownerReference: string | null
    prGeneratedAt: string | null
    pullRequestURI: string | null
    repositoryURI: string | null
    scopeID: string | null
    scopeName: string | null
    source: string | null
    state: string | null
    summary: string | null
    systemOwned: boolean | null
    ticketReference: string | null
    title: string | null
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateRemediationMutationVariables = Exact<{
  input: Types.CreateRemediationInput
}>

export interface CreateRemediationMutation {
  createRemediation: { remediation: { id: string } }
}

export type UpdateRemediationMutationVariables = Exact<{
  updateRemediationId: string
  input: Types.UpdateRemediationInput
}>

export interface UpdateRemediationMutation {
  updateRemediation: { remediation: { id: string } }
}

export type DeleteRemediationMutationVariables = Exact<{
  deleteRemediationId: string
}>

export interface DeleteRemediationMutation {
  deleteRemediation: { deletedID: string }
}

export type CreateBulkCsvRemediationMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvRemediationMutation {
  createBulkCSVRemediation: { remediations: Array<{ id: string }> | null }
}

export type DeleteBulkRemediationMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkRemediationMutation {
  deleteBulkRemediation: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetRemediationAssociationsQueryVariables = Exact<{
  remediationId: string
}>

export interface GetRemediationAssociationsQuery {
  remediation: {
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; description: string | null; displayID: string } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
  }
}

export type UpdateBulkRemediationMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateRemediationInput
}>

export interface UpdateBulkRemediationMutation {
  updateBulkRemediation: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type ReviewsWithFilterQueryVariables = Exact<{
  where?: Types.ReviewWhereInput | null | undefined
  orderBy?: Array<Types.ReviewOrder> | Types.ReviewOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface ReviewsWithFilterQuery {
  reviews: {
    totalCount: number
    edges: Array<{
      node: {
        approved: boolean | null
        approvedAt: string | null
        category: string | null
        classification: string | null
        createdAt: any
        createdBy: string | null
        details: string | null
        environmentID: string | null
        environmentName: string | null
        externalID: string | null
        externalOwnerID: string | null
        externalURI: string | null
        id: string
        metadata: any
        rawPayload: any
        reportedAt: string | null
        reporter: string | null
        reviewedAt: string | null
        reviewerID: string | null
        scopeID: string | null
        scopeName: string | null
        source: string | null
        status: Types.ReviewReviewStatus | null
        summary: string | null
        systemOwned: boolean | null
        tags: Array<string> | null
        title: string
        updatedAt: any
        updatedBy: string | null
        controls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
        subcontrols: { edges: Array<{ node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type ReviewQueryVariables = Exact<{
  reviewId: string
}>

export interface ReviewQuery {
  review: {
    approved: boolean | null
    approvedAt: string | null
    category: string | null
    classification: string | null
    createdAt: any
    createdBy: string | null
    details: string | null
    environmentID: string | null
    environmentName: string | null
    externalID: string | null
    externalOwnerID: string | null
    externalURI: string | null
    id: string
    metadata: any
    rawPayload: any
    reportedAt: string | null
    reporter: string | null
    reviewedAt: string | null
    reviewerID: string | null
    scopeID: string | null
    scopeName: string | null
    source: string | null
    status: Types.ReviewReviewStatus | null
    summary: string | null
    systemOwned: boolean | null
    tags: Array<string> | null
    title: string
    updatedAt: any
    updatedBy: string | null
    controls: { edges: Array<{ node: { __typename: 'Control'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
    subcontrols: { edges: Array<{ node: { __typename: 'Subcontrol'; id: string; refCode: string; referenceFramework: string | null } | null } | null> | null }
    comments: { edges: Array<{ node: { id: string; displayID: string; text: string; createdAt: any; createdBy: string | null; updatedAt: any; updatedBy: string | null } | null } | null> | null }
  }
}

export type CreateReviewMutationVariables = Exact<{
  input: Types.CreateReviewInput
  reviewFiles?: Array<any> | any | null | undefined
}>

export interface CreateReviewMutation {
  createReview: { review: { id: string } }
}

export type UpdateReviewMutationVariables = Exact<{
  updateReviewId: string
  input: Types.UpdateReviewInput
  reviewFiles?: Array<any> | any | null | undefined
}>

export interface UpdateReviewMutation {
  updateReview: { review: { id: string } }
}

export type DeleteReviewMutationVariables = Exact<{
  deleteReviewId: string
}>

export interface DeleteReviewMutation {
  deleteReview: { deletedID: string }
}

export type CreateBulkCsvReviewMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvReviewMutation {
  createBulkCSVReview: { reviews: Array<{ id: string }> | null }
}

export type UpdateBulkReviewMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateReviewInput
}>

export interface UpdateBulkReviewMutation {
  updateBulkReview: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type DeleteBulkReviewMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkReviewMutation {
  deleteBulkReview: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetReviewAssociationsQueryVariables = Exact<{
  reviewId: string
}>

export interface GetReviewAssociationsQuery {
  review: {
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string; description: string | null } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string; description: string | null } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; displayName: string | null } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; displayID: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; displayName: string | null } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    programs: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
    risks: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string } | null } | null> | null }
  }
}

export type GetReviewFilesPaginatedQueryVariables = Exact<{
  reviewId: string
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  orderBy?: Array<Types.FileOrder> | Types.FileOrder | null | undefined
}>

export interface GetReviewFilesPaginatedQuery {
  review: {
    files: {
      totalCount: number
      pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
      edges: Array<{
        node: { providedFileName: string; providedFileSize: number | null; providedFileExtension: string; id: string; uri: string | null; presignedURL: string | null } | null
      } | null> | null
    }
  }
}

export type GetProgramReviewStatsQueryVariables = Exact<{
  programId: string
}>

export interface GetProgramReviewStatsQuery {
  completed: { totalCount: number }
  inProgress: { totalCount: number }
}

export type RiskFieldsFragment = {
  id: string
  displayID: string
  name: string
  details: string | null
  detailsJSON: Array<any> | null
  tags: Array<string> | null
  riskCategoryName: string | null
  riskKindName: string | null
  score: number | null
  status: Types.RiskRiskStatus | null
  businessCosts: string | null
  lastReviewedAt: string | null
  likelihood: Types.RiskRiskLikelihood | null
  impact: Types.RiskRiskImpact | null
  mitigatedAt: string | null
  mitigation: string | null
  nextReviewDueAt: string | null
  residualScore: number | null
  reviewFrequency: Types.RiskFrequency | null
  environmentName: string | null
  scopeName: string | null
  reviewRequired: boolean | null
  dueDate: string | null
  riskDecision: Types.RiskRiskDecision | null
  createdAt: any
  stakeholder: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
  delegate: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
}

export type RiskTableFieldsFragment = {
  id: string
  displayID: string
  name: string
  riskCategoryName: string | null
  riskKindName: string | null
  score: number | null
  status: Types.RiskRiskStatus | null
  businessCosts: string | null
  details: string | null
  impact: Types.RiskRiskImpact | null
  lastReviewedAt: string | null
  likelihood: Types.RiskRiskLikelihood | null
  mitigation: string | null
  mitigatedAt: string | null
  updatedAt: any
  updatedBy: string | null
  createdAt: any
  createdBy: string | null
  nextReviewDueAt: string | null
  residualScore: number | null
  reviewFrequency: Types.RiskFrequency | null
  reviewRequired: boolean | null
  riskDecision: Types.RiskRiskDecision | null
  environmentName: string | null
  scopeName: string | null
  delegate: { displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
  stakeholder: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
}

export type GetRiskByIdQueryVariables = Exact<{
  riskId: string
}>

export interface GetRiskByIdQuery {
  risk: {
    id: string
    displayID: string
    name: string
    details: string | null
    detailsJSON: Array<any> | null
    tags: Array<string> | null
    riskCategoryName: string | null
    riskKindName: string | null
    score: number | null
    status: Types.RiskRiskStatus | null
    businessCosts: string | null
    lastReviewedAt: string | null
    likelihood: Types.RiskRiskLikelihood | null
    impact: Types.RiskRiskImpact | null
    mitigatedAt: string | null
    mitigation: string | null
    nextReviewDueAt: string | null
    residualScore: number | null
    reviewFrequency: Types.RiskFrequency | null
    environmentName: string | null
    scopeName: string | null
    reviewRequired: boolean | null
    dueDate: string | null
    riskDecision: Types.RiskRiskDecision | null
    createdAt: any
    stakeholder: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
    delegate: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
  }
}

export type GetAllRisksQueryVariables = Exact<{
  where?: Types.RiskWhereInput | null | undefined
  orderBy?: Array<Types.RiskOrder> | Types.RiskOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllRisksQuery {
  risks: {
    totalCount: number
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
    edges: Array<{
      node: {
        id: string
        displayID: string
        name: string
        riskCategoryName: string | null
        riskKindName: string | null
        score: number | null
        status: Types.RiskRiskStatus | null
        businessCosts: string | null
        details: string | null
        impact: Types.RiskRiskImpact | null
        lastReviewedAt: string | null
        likelihood: Types.RiskRiskLikelihood | null
        mitigation: string | null
        mitigatedAt: string | null
        updatedAt: any
        updatedBy: string | null
        createdAt: any
        createdBy: string | null
        nextReviewDueAt: string | null
        residualScore: number | null
        reviewFrequency: Types.RiskFrequency | null
        reviewRequired: boolean | null
        riskDecision: Types.RiskRiskDecision | null
        environmentName: string | null
        scopeName: string | null
        delegate: { displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
        stakeholder: { id: string; displayName: string; gravatarLogoURL: string | null; logoURL: string | null; avatarFile: { base64: string | null } | null } | null
      } | null
    } | null> | null
  }
}

export type UpdateRiskMutationVariables = Exact<{
  updateRiskId: string
  input: Types.UpdateRiskInput
}>

export interface UpdateRiskMutation {
  updateRisk: { risk: { id: string } }
}

export type UpdateBulkRiskMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateRiskInput
}>

export interface UpdateBulkRiskMutation {
  updateBulkRisk: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type CreateBulkCsvRiskMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvRiskMutation {
  createBulkCSVRisk: { risks: Array<{ id: string }> | null }
}

export type DeleteRiskMutationVariables = Exact<{
  deleteRiskId: string
}>

export interface DeleteRiskMutation {
  deleteRisk: { deletedID: string }
}

export type CreateRiskMutationVariables = Exact<{
  input: Types.CreateRiskInput
}>

export interface CreateRiskMutation {
  createRisk: { risk: { id: string } }
}

export type DeleteBulkRiskMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkRiskMutation {
  deleteBulkRisk: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetOpenRiskCountQueryVariables = Exact<{ [key: string]: never }>

export interface GetOpenRiskCountQuery {
  risks: { totalCount: number }
}

export type RiskDiscussionFieldsFragment = {
  __typename: 'Risk'
  id: string
  name: string
  discussions: {
    edges: Array<{
      node: {
        id: string
        externalID: string | null
        createdAt: any
        isResolved: boolean
        comments: {
          edges: Array<{
            node: {
              updatedBy: string | null
              updatedAt: any
              text: string
              noteRef: string | null
              isEdited: boolean
              id: string
              displayID: string
              discussionID: string | null
              createdAt: any
              createdBy: string | null
            } | null
          } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type GetRiskDiscussionByIdQueryVariables = Exact<{
  riskId: string
}>

export interface GetRiskDiscussionByIdQuery {
  risk: {
    __typename: 'Risk'
    id: string
    name: string
    discussions: {
      edges: Array<{
        node: {
          id: string
          externalID: string | null
          createdAt: any
          isResolved: boolean
          comments: {
            edges: Array<{
              node: {
                updatedBy: string | null
                updatedAt: any
                text: string
                noteRef: string | null
                isEdited: boolean
                id: string
                displayID: string
                discussionID: string | null
                createdAt: any
                createdBy: string | null
              } | null
            } | null> | null
          }
        } | null
      } | null> | null
    }
  }
}

export type InsertRiskCommentMutationVariables = Exact<{
  updateRiskId: string
  input: Types.UpdateRiskInput
}>

export interface InsertRiskCommentMutation {
  updateRisk: {
    risk: {
      discussions: {
        edges: Array<{
          node: {
            id: string
            externalID: string | null
            isResolved: boolean
            comments: { edges: Array<{ node: { text: string; isEdited: boolean; id: string; noteRef: string | null } | null } | null> | null }
          } | null
        } | null> | null
      }
    }
  }
}

export type UpdateRiskCommentMutationVariables = Exact<{
  updateRiskCommentId: string
  input: Types.UpdateNoteInput
}>

export interface UpdateRiskCommentMutation {
  updateRiskComment: { risk: { id: string } }
}

export type GetRiskAssociationsTimelineQueryVariables = Exact<{
  riskId: string
}>

export interface GetRiskAssociationsTimelineQuery {
  risk: {
    procedures: { edges: Array<{ node: { id: string; name: string; displayID: string; createdAt: any } | null } | null> | null }
    controls: { edges: Array<{ node: { id: string; displayID: string; refCode: string; createdAt: any } | null } | null> | null }
    subcontrols: { edges: Array<{ node: { id: string; displayID: string; refCode: string; createdAt: any } | null } | null> | null }
    programs: { edges: Array<{ node: { id: string; name: string; displayID: string; createdAt: any } | null } | null> | null }
    tasks: { edges: Array<{ node: { id: string; title: string; displayID: string; createdAt: any } | null } | null> | null }
    assets: { edges: Array<{ node: { id: string; name: string; displayName: string | null; createdAt: any } | null } | null> | null }
    scans: { edges: Array<{ node: { id: string; target: string; createdAt: any; createdBy: string | null } | null } | null> | null }
    reviews: { edges: Array<{ node: { id: string; title: string; createdAt: any; createdBy: string | null } | null } | null> | null }
    actionPlans: { edges: Array<{ node: { id: string; name: string; createdAt: any; createdBy: string | null } | null } | null> | null }
  }
}

export type GetRiskAssociationsQueryVariables = Exact<{
  riskId: string
}>

export interface GetRiskAssociationsQuery {
  risk: {
    controls: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; refCode: string } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; refCode: string; controlId: string } | null } | null> | null }
    programs: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; name: string; description: string | null } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; title: string; details: string | null } | null } | null> | null }
    internalPolicies: { totalCount: number; edges: Array<{ node: { id: string; displayID: string; name: string } | null } | null> | null }
    procedures: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string; createdAt: any } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    scans: { totalCount: number; edges: Array<{ node: { id: string; target: string } | null } | null> | null }
    reviews: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
    actionPlans: { totalCount: number; edges: Array<{ node: { id: string; name: string; status: Types.ActionPlanDocumentStatus | null } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; title: string | null; displayID: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
  }
}

export type ScansWithFilterQueryVariables = Exact<{
  where?: Types.ScanWhereInput | null | undefined
  orderBy?: Array<Types.ScanOrder> | Types.ScanOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface ScansWithFilterQuery {
  scans: {
    totalCount: number
    edges: Array<{
      node: {
        assignedTo: string | null
        createdAt: any
        createdBy: string | null
        environmentID: string | null
        environmentName: string | null
        generatedByPlatformID: string | null
        id: string
        metadata: any
        nextScanRunAt: string | null
        performedBy: string | null
        reviewedBy: string | null
        scanDate: string | null
        scanSchedule: string | null
        scanType: Types.ScanScanType
        scopeID: string | null
        scopeName: string | null
        status: Types.ScanScanStatus
        target: string
        updatedAt: any
        updatedBy: string | null
        assignedToUser: { id: string; displayName: string } | null
        assignedToGroup: { id: string; displayName: string } | null
        performedByUser: { id: string; displayName: string } | null
        performedByGroup: { id: string; displayName: string } | null
        reviewedByUser: { id: string; displayName: string } | null
        reviewedByGroup: { id: string; displayName: string } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type ScanQueryVariables = Exact<{
  scanId: string
}>

export interface ScanQuery {
  scan: {
    assignedTo: string | null
    createdAt: any
    createdBy: string | null
    environmentID: string | null
    environmentName: string | null
    generatedByPlatformID: string | null
    id: string
    metadata: any
    nextScanRunAt: string | null
    performedBy: string | null
    reviewedBy: string | null
    scanDate: string | null
    scanSchedule: string | null
    scanType: Types.ScanScanType
    scopeID: string | null
    scopeName: string | null
    status: Types.ScanScanStatus
    tags: Array<string> | null
    target: string
    updatedAt: any
    updatedBy: string | null
    assignedToUser: { id: string; displayName: string } | null
    assignedToGroup: { id: string; displayName: string } | null
    performedByUser: { id: string; displayName: string } | null
    performedByGroup: { id: string; displayName: string } | null
    reviewedByUser: { id: string; displayName: string } | null
    reviewedByGroup: { id: string; displayName: string } | null
  }
}

export type CreateScanMutationVariables = Exact<{
  input: Types.CreateScanInput
}>

export interface CreateScanMutation {
  createScan: { scan: { id: string } }
}

export type ImportDomainScanReviewMutationVariables = Exact<{
  input: Types.ImportDomainScanReviewInput
}>

export interface ImportDomainScanReviewMutation {
  importDomainScanReview: { accepted: boolean }
}

export type UpdateScanMutationVariables = Exact<{
  updateScanId: string
  input: Types.UpdateScanInput
}>

export interface UpdateScanMutation {
  updateScan: { scan: { id: string } }
}

export type DeleteScanMutationVariables = Exact<{
  deleteScanId: string
}>

export interface DeleteScanMutation {
  deleteScan: { deletedID: string }
}

export type CreateBulkCsvScanMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvScanMutation {
  createBulkCSVScan: { scans: Array<{ id: string }> | null }
}

export type DeleteBulkScanMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkScanMutation {
  deleteBulkScan: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkScanMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateScanInput
}>

export interface UpdateBulkScanMutation {
  updateBulkScan: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetScanAssociationsQueryVariables = Exact<{
  scanId: string
}>

export interface GetScanAssociationsQuery {
  scan: {
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; description: string | null; displayID: string } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; title: string | null; displayID: string } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
  }
}

export type ScheduledJobRunsWithFilterQueryVariables = Exact<{
  where?: Types.ScheduledJobRunWhereInput | null | undefined
  orderBy?: Array<Types.ScheduledJobRunOrder> | Types.ScheduledJobRunOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface ScheduledJobRunsWithFilterQuery {
  scheduledJobRuns: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        expectedExecutionTime: any
        id: string
        jobRunnerID: string
        scheduledJobID: string
        script: string
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type ScheduledJobRunQueryVariables = Exact<{
  scheduledJobRunId: string
}>

export interface ScheduledJobRunQuery {
  scheduledJobRun: {
    createdAt: any
    createdBy: string | null
    expectedExecutionTime: any
    id: string
    jobRunnerID: string
    scheduledJobID: string
    script: string
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateScheduledJobRunMutationVariables = Exact<{
  input: Types.CreateScheduledJobRunInput
}>

export interface CreateScheduledJobRunMutation {
  createScheduledJobRun: { scheduledJobRun: { id: string } }
}

export type UpdateScheduledJobRunMutationVariables = Exact<{
  updateScheduledJobRunId: string
  input: Types.UpdateScheduledJobRunInput
}>

export interface UpdateScheduledJobRunMutation {
  updateScheduledJobRun: { scheduledJobRun: { id: string } }
}

export type DeleteScheduledJobRunMutationVariables = Exact<{
  deleteScheduledJobRunId: string
}>

export interface DeleteScheduledJobRunMutation {
  deleteScheduledJobRun: { deletedID: string }
}

export type ScheduledJobsWithFilterQueryVariables = Exact<{
  where?: Types.ScheduledJobWhereInput | null | undefined
  orderBy?: Array<Types.ScheduledJobOrder> | Types.ScheduledJobOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface ScheduledJobsWithFilterQuery {
  scheduledJobs: {
    totalCount: number
    edges: Array<{
      node: {
        active: boolean
        configuration: any
        createdAt: any
        createdBy: string | null
        cron: string | null
        displayID: string
        id: string
        jobID: string
        jobRunnerID: string | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type ScheduledJobQueryVariables = Exact<{
  scheduledJobId: string
}>

export interface ScheduledJobQuery {
  scheduledJob: {
    active: boolean
    configuration: any
    createdAt: any
    createdBy: string | null
    cron: string | null
    displayID: string
    id: string
    jobID: string
    jobRunnerID: string | null
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateScheduledJobMutationVariables = Exact<{
  input: Types.CreateScheduledJobInput
}>

export interface CreateScheduledJobMutation {
  createScheduledJob: { scheduledJob: { id: string } }
}

export type UpdateScheduledJobMutationVariables = Exact<{
  updateScheduledJobId: string
  input: Types.UpdateScheduledJobInput
}>

export interface UpdateScheduledJobMutation {
  updateScheduledJob: { scheduledJob: { id: string } }
}

export type DeleteScheduledJobMutationVariables = Exact<{
  deleteScheduledJobId: string
}>

export interface DeleteScheduledJobMutation {
  deleteScheduledJob: { deletedID: string }
}

export type SearchQueryVariables = Exact<{
  query: string
}>

export interface SearchQuery {
  search: {
    searchContext: Array<{ entityID: string; entityType: string; matchedFields: Array<string>; snippets: Array<{ field: string; text: string }> | null }> | null
    controls: {
      edges: Array<{
        node: {
          id: string
          refCode: string
          ownerID: string | null
          standardID: string | null
          isTrustCenterControl: boolean | null
          systemOwned: boolean | null
          standard: { framework: string | null } | null
        } | null
      } | null> | null
    } | null
    subcontrols: {
      edges: Array<{
        node: { id: string; refCode: string; systemOwned: boolean | null; control: { id: string; isTrustCenterControl: boolean | null; standard: { framework: string | null } | null } } | null
      } | null> | null
    } | null
    internalPolicies: { edges: Array<{ node: { id: string; name: string } | null } | null> | null } | null
    procedures: { edges: Array<{ node: { id: string; name: string } | null } | null> | null } | null
    programs: { edges: Array<{ node: { id: string; name: string } | null } | null> | null } | null
    tasks: { edges: Array<{ node: { id: string; title: string } | null } | null> | null } | null
    risks: { edges: Array<{ node: { id: string; name: string } | null } | null> | null } | null
    groups: { edges: Array<{ node: { id: string; displayName: string; name: string } | null } | null> | null } | null
    organizations: { edges: Array<{ node: { id: string; displayName: string; name: string } | null } | null> | null } | null
    standards: { edges: Array<{ node: { id: string; name: string; shortName: string | null; framework: string | null; systemOwned: boolean | null } | null } | null> | null } | null
    templates: { edges: Array<{ node: { id: string; name: string } | null } | null> | null } | null
    evidences: { edges: Array<{ node: { id: string; name: string } | null } | null> | null } | null
  } | null
}

export type SlaDefinitionsWithFilterQueryVariables = Exact<{
  where?: Types.SlaDefinitionWhereInput | null | undefined
  orderBy?: Array<Types.SlaDefinitionOrder> | Types.SlaDefinitionOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface SlaDefinitionsWithFilterQuery {
  slaDefinitions: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        displayID: string
        id: string
        slaDays: number
        securityLevel: Types.SlaDefinitionSecurityLevel
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type SlaDefinitionQueryVariables = Exact<{
  slaDefinitionId: string
}>

export interface SlaDefinitionQuery {
  slaDefinition: { createdAt: any; createdBy: string | null; displayID: string; id: string; slaDays: number; securityLevel: Types.SlaDefinitionSecurityLevel; updatedAt: any; updatedBy: string | null }
}

export type CreateSlaDefinitionMutationVariables = Exact<{
  input: Types.CreateSlaDefinitionInput
}>

export interface CreateSlaDefinitionMutation {
  createSLADefinition: { slaDefinition: { id: string } }
}

export type UpdateSlaDefinitionMutationVariables = Exact<{
  updateSlaDefinitionId: string
  input: Types.UpdateSlaDefinitionInput
}>

export interface UpdateSlaDefinitionMutation {
  updateSLADefinition: { slaDefinition: { id: string } }
}

export type DeleteSlaDefinitionMutationVariables = Exact<{
  deleteSlaDefinitionId: string
}>

export interface DeleteSlaDefinitionMutation {
  deleteSLADefinition: { deletedID: string }
}

export type CreateBulkCsvSlaDefinitionMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvSlaDefinitionMutation {
  createBulkCSVSLADefinition: { slaDefinitions: Array<{ id: string }> | null }
}

export type DeleteBulkSlaDefinitionMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkSlaDefinitionMutation {
  deleteBulkSLADefinition: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkSlaDefinitionMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateSlaDefinitionInput
}>

export interface UpdateBulkSlaDefinitionMutation {
  updateBulkSLADefinition: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetAllStandardsQueryVariables = Exact<{
  where?: Types.StandardWhereInput | null | undefined
}>

export interface GetAllStandardsQuery {
  standards: {
    totalCount: number
    pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
    edges: Array<{
      node: {
        id: string
        shortName: string | null
        version: string | null
        governingBodyLogoURL: string | null
        standardType: string | null
        updatedAt: any
        tags: Array<string> | null
        description: string | null
        domains: Array<string> | null
        controls: { totalCount: number }
      } | null
    } | null> | null
  }
}

export type GetStandardByIdMinifiedQueryVariables = Exact<{
  standardId: string
}>

export interface GetStandardByIdMinifiedQuery {
  standard: { id: string; shortName: string | null; name: string }
}

export type GetStandardDetailsQueryVariables = Exact<{
  standardId: string
}>

export interface GetStandardDetailsQuery {
  standard: {
    id: string
    shortName: string | null
    version: string | null
    governingBodyLogoURL: string | null
    standardType: string | null
    updatedAt: any
    tags: Array<string> | null
    description: string | null
    name: string
    revision: string | null
    link: string | null
    framework: string | null
    governingBody: string | null
    controls: { totalCount: number }
    controlsWithSubcontrols: { totalCount: number }
    logoFile: { base64: string | null } | null
  }
}

export type CreateControlsByCloneMutationVariables = Exact<{
  input: Types.CloneControlInput
}>

export interface CreateControlsByCloneMutation {
  createControlsByClone: { controls: Array<{ id: string }> | null }
}

export type GetAllStandardsSelectQueryVariables = Exact<{
  where?: Types.StandardWhereInput | null | undefined
}>

export interface GetAllStandardsSelectQuery {
  standards: { edges: Array<{ node: { id: string; shortName: string | null } | null } | null> | null }
}

export type GetStandardsPaginatedQueryVariables = Exact<{
  where?: Types.StandardWhereInput | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
  orderBy?: Array<Types.StandardOrder> | Types.StandardOrder | null | undefined
}>

export interface GetStandardsPaginatedQuery {
  standards: {
    totalCount: number
    edges: Array<{
      node: { id: string; shortName: string | null; description: string | null; systemOwned: boolean | null; governingBodyLogoURL: string | null; logoFile: { base64: string | null } | null } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type CreateStandardMutationVariables = Exact<{
  input: Types.CreateStandardInput
  logoFile?: any
}>

export interface CreateStandardMutation {
  createStandard: { standard: { id: string } }
}

export type UpdateStandardMutationVariables = Exact<{
  updateStandardId: string
  input: Types.UpdateStandardInput
  logoFile?: any
}>

export interface UpdateStandardMutation {
  updateStandard: { standard: { id: string } }
}

export type DeleteStandardMutationVariables = Exact<{
  deleteStandardId: string
}>

export interface DeleteStandardMutation {
  deleteStandard: { deletedID: string }
}

export type GetAllSubcontrolsQueryVariables = Exact<{
  where?: Types.SubcontrolWhereInput | null | undefined
  after?: any
  first?: number | null | undefined
}>

export interface GetAllSubcontrolsQuery {
  subcontrols: {
    totalCount: number
    edges: Array<{ node: { __typename: 'Subcontrol'; id: string; displayID: string; description: string | null; refCode: string; referenceFramework: string | null } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetSubcontrolByIdQueryVariables = Exact<{
  subcontrolId: string
}>

export interface GetSubcontrolByIdQuery {
  subcontrol: {
    __typename: 'Subcontrol'
    id: string
    category: string | null
    refCode: string
    subcategory: string | null
    mappedCategories: Array<string> | null
    status: Types.SubcontrolControlStatus | null
    tags: Array<string> | null
    description: string | null
    descriptionJSON: Array<any> | null
    implementationGuidance: Array<any> | null
    exampleEvidence: Array<any> | null
    evidenceRequests: Array<any> | null
    controlQuestions: Array<string> | null
    assessmentMethods: Array<any> | null
    assessmentObjectives: Array<any> | null
    testingProcedures: Array<any> | null
    references: Array<any> | null
    displayID: string
    source: Types.SubcontrolControlSource | null
    sourceName: string | null
    subcontrolKindName: string | null
    publicRepresentation: string | null
    auditorReferenceID: string | null
    referenceID: string | null
    referenceFramework: string | null
    title: string | null
    control: { refCode: string; id: string }
    controlObjectives: {
      edges: Array<{
        node: {
          id: string
          status: Types.ControlObjectiveObjectiveStatus | null
          desiredOutcome: string | null
          name: string
          displayID: string
          controls: { edges: Array<{ node: { id: string } | null } | null> | null }
        } | null
      } | null> | null
    }
    controlImplementations: { edges: Array<{ node: { details: string | null; status: Types.ControlImplementationDocumentStatus | null; verificationDate: any } | null } | null> | null }
    evidence: { edges: Array<{ node: { id: string; displayID: string; name: string; creationDate: string } | null } | null> | null }
    delegate: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
    controlOwner: { id: string; displayName: string; logoURL: string | null; gravatarLogoURL: string | null; avatarFile: { base64: string | null } | null } | null
    responsibleParty: { id: string; displayName: string | null; name: string | null; logoFile: { base64: string | null } | null } | null
  }
}

export type GetSubcontrolAssociationsByIdQueryVariables = Exact<{
  subcontrolId: string
}>

export interface GetSubcontrolAssociationsByIdQuery {
  subcontrol: {
    internalPolicies: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          name: string
          displayID: string
          approver: { gravatarLogoURL: string | null; logoURL: string | null; displayName: string; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
    procedures: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          name: string
          displayID: string
          approver: { gravatarLogoURL: string | null; logoURL: string | null; displayName: string; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
    tasks: {
      totalCount: number
      edges: Array<{
        node: {
          id: string
          title: string
          displayID: string
          details: string | null
          assignee: { displayName: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
    risks: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayID: string; details: string | null } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    entities: { totalCount: number; edges: Array<{ node: { id: string; name: string | null; displayName: string | null } | null } | null> | null }
    identityHolders: {
      totalCount: number
      edges: Array<{ node: { id: string; fullName: string; displayID: string; identityHolderType: Types.IdentityHolderIdentityHolderType; title: string | null } | null } | null> | null
    }
    vulnerabilities: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
  }
}

export type UpdateSubcontrolMutationVariables = Exact<{
  updateSubcontrolId: string
  input: Types.UpdateSubcontrolInput
}>

export interface UpdateSubcontrolMutation {
  updateSubcontrol: { subcontrol: { id: string } }
}

export type UpdateBulkSubcontrolMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateSubcontrolInput
}>

export interface UpdateBulkSubcontrolMutation {
  updateBulkSubcontrol: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type DeleteSubcontrolMutationVariables = Exact<{
  deleteSubcontrolId: string
}>

export interface DeleteSubcontrolMutation {
  deleteSubcontrol: { deletedID: string }
}

export type CreateSubcontrolMutationVariables = Exact<{
  input: Types.CreateSubcontrolInput
}>

export interface CreateSubcontrolMutation {
  createSubcontrol: { subcontrol: { id: string } }
}

export type GetSubcontrolsPaginatedQueryVariables = Exact<{
  where?: Types.SubcontrolWhereInput | null | undefined
  after?: any
  before?: any
  first?: number | null | undefined
  last?: number | null | undefined
}>

export interface GetSubcontrolsPaginatedQuery {
  subcontrols: {
    totalCount: number
    edges: Array<{
      node: {
        __typename: 'Subcontrol'
        id: string
        refCode: string
        description: string | null
        status: Types.SubcontrolControlStatus | null
        subcontrolKindName: string | null
        source: Types.SubcontrolControlSource | null
        sourceName: string | null
        publicRepresentation: string | null
        category: string | null
        subcategory: string | null
        referenceFramework: string | null
        controlID: string
      } | null
    } | null> | null
    pageInfo: { hasNextPage: boolean; endCursor: any }
  }
}

export type GetSubcontrolByIdMinifiedQueryVariables = Exact<{
  subcontrolId: string
}>

export interface GetSubcontrolByIdMinifiedQuery {
  subcontrol: {
    id: string
    refCode: string
    category: string | null
    subcategory: string | null
    description: string | null
    referenceFramework: string | null
    title: string | null
    control: { id: string; standardID: string | null }
  }
}

export type GetSubcontrolsByRefCodeQueryVariables = Exact<{
  refCodeIn?: Array<string> | string | null | undefined
}>

export interface GetSubcontrolsByRefCodeQuery {
  subcontrols: {
    edges: Array<{
      node: {
        id: string
        refCode: string
        description: string | null
        status: Types.SubcontrolControlStatus | null
        subcontrolKindName: string | null
        source: Types.SubcontrolControlSource | null
        sourceName: string | null
        publicRepresentation: string | null
        category: string | null
        subcategory: string | null
        referenceFramework: string | null
        systemOwned: boolean | null
        controlID: string
        control: { standardID: string | null }
      } | null
    } | null> | null
  }
}

export type GetSubcontrolRelatedControlsQueryVariables = Exact<{
  subcontrolId: string
}>

export interface GetSubcontrolRelatedControlsQuery {
  subcontrol: {
    id: string
    relatedControls: Array<{
      id: string
      refCode: string
      status: Types.ControlControlStatus | null
      referenceFramework: string | null
      isSubcontrol: boolean
      mappedControlReferenceIDs: Array<string> | null
      category: string | null
      subcategory: string | null
      description: string | null
    }> | null
  }
}

export type GetSubcontrolCommentsQueryVariables = Exact<{
  subcontrolId: string
}>

export interface GetSubcontrolCommentsQuery {
  subcontrol: { comments: { edges: Array<{ node: { id: string; createdAt: any; createdBy: string | null; text: string } | null } | null> | null } }
}

export type UpdateSubcontrolCommentMutationVariables = Exact<{
  updateSubcontrolCommentId: string
  input: Types.UpdateNoteInput
}>

export interface UpdateSubcontrolCommentMutation {
  updateSubcontrolComment: { subcontrol: { id: string } }
}

export type GetExistingSubcontrolsForOrganizationQueryVariables = Exact<{
  where?: Types.SubcontrolWhereInput | null | undefined
}>

export interface GetExistingSubcontrolsForOrganizationQuery {
  subcontrols: { edges: Array<{ node: { id: string; refCode: string; referenceFramework: string | null; ownerID: string | null; systemOwned: boolean | null } | null } | null> | null }
}

export type SubcontrolDiscussionFieldsFragment = {
  __typename: 'Subcontrol'
  id: string
  refCode: string
  title: string | null
  discussions: {
    edges: Array<{
      node: {
        id: string
        externalID: string | null
        createdAt: any
        isResolved: boolean
        comments: {
          edges: Array<{
            node: {
              updatedBy: string | null
              updatedAt: any
              text: string
              noteRef: string | null
              isEdited: boolean
              id: string
              displayID: string
              discussionID: string | null
              createdAt: any
              createdBy: string | null
            } | null
          } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type GetSubcontrolDiscussionByIdQueryVariables = Exact<{
  subcontrolId: string
}>

export interface GetSubcontrolDiscussionByIdQuery {
  subcontrol: {
    __typename: 'Subcontrol'
    id: string
    refCode: string
    title: string | null
    discussions: {
      edges: Array<{
        node: {
          id: string
          externalID: string | null
          createdAt: any
          isResolved: boolean
          comments: {
            edges: Array<{
              node: {
                updatedBy: string | null
                updatedAt: any
                text: string
                noteRef: string | null
                isEdited: boolean
                id: string
                displayID: string
                discussionID: string | null
                createdAt: any
                createdBy: string | null
              } | null
            } | null> | null
          }
        } | null
      } | null> | null
    }
  }
}

export type InsertSubcontrolPlateCommentMutationVariables = Exact<{
  updateSubcontrolId: string
  input: Types.UpdateSubcontrolInput
}>

export interface InsertSubcontrolPlateCommentMutation {
  updateSubcontrol: {
    subcontrol: {
      discussions: {
        edges: Array<{
          node: {
            id: string
            externalID: string | null
            isResolved: boolean
            comments: { edges: Array<{ node: { text: string; isEdited: boolean; id: string; noteRef: string | null } | null } | null> | null }
          } | null
        } | null> | null
      }
    }
  }
}

export type CreateSubprocessorMutationVariables = Exact<{
  input: Types.CreateSubprocessorInput
  logoFile?: any
}>

export interface CreateSubprocessorMutation {
  createSubprocessor: { subprocessor: { id: string; name: string; logoRemoteURL: string | null; logoFile: { base64: string | null } | null } }
}

export type UpdateSubprocessorMutationVariables = Exact<{
  updateSubprocessorId: string
  input: Types.UpdateSubprocessorInput
  logoFile?: any
}>

export interface UpdateSubprocessorMutation {
  updateSubprocessor: { subprocessor: { id: string } }
}

export type GetSubprocessorsQueryVariables = Exact<{
  where?: Types.SubprocessorWhereInput | null | undefined
  first?: number | null | undefined
  orderBy?: Array<Types.SubprocessorOrder> | Types.SubprocessorOrder | null | undefined
  after?: any
  before?: any
  last?: number | null | undefined
}>

export interface GetSubprocessorsQuery {
  subprocessors: {
    totalCount: number
    edges: Array<{ node: { id: string; name: string; description: string | null; logoRemoteURL: string | null; logoFile: { base64: string | null } | null } | null } | null> | null
    pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
  }
}

export type DeleteBulkSubprocessorsMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkSubprocessorsMutation {
  deleteBulkSubprocessor: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type CreateSubscriberMutationVariables = Exact<{
  input: Types.CreateSubscriberInput
}>

export interface CreateSubscriberMutation {
  createSubscriber: { subscriber: { email: string } }
}

export type GetAllSubscribersQueryVariables = Exact<{
  where?: Types.SubscriberWhereInput | null | undefined
  orderBy?: Array<Types.SubscriberOrder> | Types.SubscriberOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface GetAllSubscribersQuery {
  subscribers: {
    totalCount: number
    edges: Array<{ node: { active: boolean; email: string; id: string; verifiedEmail: boolean; unsubscribed: boolean; createdAt: any } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any }
  }
}

export type DeleteSubscriberMutationVariables = Exact<{
  deleteSubscriberEmail: string
}>

export interface DeleteSubscriberMutation {
  deleteSubscriber: { email: string }
}

export type UpdateSubscriberMutationVariables = Exact<{
  email: string
  input: Types.UpdateSubscriberInput
}>

export interface UpdateSubscriberMutation {
  updateSubscriber: { subscriber: { id: string } }
}

export type CreateBulkCsvSubscriberMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvSubscriberMutation {
  createBulkCSVSubscriber: { subscribers: Array<{ id: string }> | null }
}

export type SystemDetailsWithFilterQueryVariables = Exact<{
  where?: Types.SystemDetailWhereInput | null | undefined
  orderBy?: Array<Types.SystemDetailOrder> | Types.SystemDetailOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface SystemDetailsWithFilterQuery {
  systemDetails: {
    totalCount: number
    edges: Array<{
      node: {
        authorizationBoundary: string | null
        createdAt: any
        createdBy: string | null
        description: string | null
        displayID: string
        id: string
        lastReviewed: string | null
        oscalMetadataJSON: any
        revisionHistory: Array<any> | null
        sensitivityLevel: Types.SystemDetailSystemSensitivityLevel | null
        systemName: string
        tags: Array<string> | null
        updatedAt: any
        updatedBy: string | null
        version: string | null
        platforms: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
        programs: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type SystemDetailQueryVariables = Exact<{
  systemDetailId: string
}>

export interface SystemDetailQuery {
  systemDetail: {
    authorizationBoundary: string | null
    createdAt: any
    createdBy: string | null
    description: string | null
    displayID: string
    id: string
    lastReviewed: string | null
    oscalMetadataJSON: any
    revisionHistory: Array<any> | null
    sensitivityLevel: Types.SystemDetailSystemSensitivityLevel | null
    systemName: string
    tags: Array<string> | null
    updatedAt: any
    updatedBy: string | null
    version: string | null
    platforms: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
    programs: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
  }
}

export type CreateSystemDetailMutationVariables = Exact<{
  input: Types.CreateSystemDetailInput
}>

export interface CreateSystemDetailMutation {
  createSystemDetail: { systemDetail: { id: string } }
}

export type UpdateSystemDetailMutationVariables = Exact<{
  updateSystemDetailId: string
  input: Types.UpdateSystemDetailInput
}>

export interface UpdateSystemDetailMutation {
  updateSystemDetail: { systemDetail: { id: string } }
}

export type DeleteSystemDetailMutationVariables = Exact<{
  deleteSystemDetailId: string
}>

export interface DeleteSystemDetailMutation {
  deleteSystemDetail: { deletedID: string }
}

export type CreateBulkCsvSystemDetailMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvSystemDetailMutation {
  createBulkCSVSystemDetail: { systemDetails: Array<{ id: string }> | null }
}

export type DeleteBulkSystemDetailMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkSystemDetailMutation {
  deleteBulkSystemDetail: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkSystemDetailMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateSystemDetailInput
}>

export interface UpdateBulkSystemDetailMutation {
  updateBulkSystemDetail: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetTagsQueryVariables = Exact<{ [key: string]: never }>

export interface GetTagsQuery {
  tagDefinitions: { edges: Array<{ node: { id: string; name: string; color: string | null } | null } | null> | null }
}

export type GetAllTagDefinitionsPaginatedQueryVariables = Exact<{
  where?: Types.TagDefinitionWhereInput | null | undefined
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
}>

export interface GetAllTagDefinitionsPaginatedQuery {
  tagDefinitions: {
    totalCount: number
    edges: Array<{
      cursor: any
      node: {
        id: string
        name: string
        aliases: Array<string> | null
        systemOwned: boolean | null
        description: string | null
        color: string | null
        updatedBy: string | null
        updatedAt: any
        createdAt: any
        createdBy: string | null
      } | null
    } | null> | null
    pageInfo: { startCursor: any; endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean }
  }
}

export type CreateTagDefinitionMutationVariables = Exact<{
  input: Types.CreateTagDefinitionInput
}>

export interface CreateTagDefinitionMutation {
  createTagDefinition: { tagDefinition: { id: string } }
}

export type UpdateTagDefinitionMutationVariables = Exact<{
  updateTagDefinitionId: string
  input: Types.UpdateTagDefinitionInput
}>

export interface UpdateTagDefinitionMutation {
  updateTagDefinition: { tagDefinition: { id: string } }
}

export type DeleteTagDefinitionMutationVariables = Exact<{
  deleteTagDefinitionId: string
}>

export interface DeleteTagDefinitionMutation {
  deleteTagDefinition: { deletedID: string }
}

export type GetTagDefinitionDetailsQueryVariables = Exact<{
  tagDefinitionId: string
}>

export interface GetTagDefinitionDetailsQuery {
  tagDefinition: { id: string; name: string; aliases: Array<string> | null; color: string | null; description: string | null }
}

export type TasksWithFilterQueryVariables = Exact<{
  where?: Types.TaskWhereInput | null | undefined
  orderBy?: Array<Types.TaskOrder> | Types.TaskOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface TasksWithFilterQuery {
  tasks: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        title: string
        status: Types.TaskTaskStatus
        tags: Array<string> | null
        due: string | null
        displayID: string
        details: string | null
        updatedAt: any
        updatedBy: string | null
        createdAt: any
        createdBy: string | null
        taskKindName: string | null
        completed: string | null
        isSuggested: boolean
        isTemplate: boolean
        priority: number
        source: string | null
        sourceKey: string | null
        metadata: any
        assigner: { displayName: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null } | null
        assignee: { displayName: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type CreateTaskMutationVariables = Exact<{
  input: Types.CreateTaskInput
}>

export interface CreateTaskMutation {
  createTask: { task: { id: string } }
}

export type UpdateTaskMutationVariables = Exact<{
  updateTaskId: string
  input: Types.UpdateTaskInput
}>

export interface UpdateTaskMutation {
  updateTask: { task: { id: string } }
}

export type DeleteTaskMutationVariables = Exact<{
  deleteTaskId: string
}>

export interface DeleteTaskMutation {
  deleteTask: { deletedID: string }
}

export type TaskQueryVariables = Exact<{
  taskId: string
}>

export interface TaskQuery {
  task: {
    tags: Array<string> | null
    id: string
    taskKindName: string | null
    title: string
    status: Types.TaskTaskStatus
    isTemplate: boolean
    due: string | null
    displayID: string
    details: string | null
    assignee: { displayName: string; avatarRemoteURL: string | null; id: string } | null
    assigner: { avatarRemoteURL: string | null; displayName: string; id: string } | null
    tasks: Array<{ id: string; title: string; displayID: string; details: string | null }> | null
    comments: {
      edges: Array<{
        node: {
          id: string
          createdAt: any
          createdBy: string | null
          text: string
          owner: { avatarRemoteURL: string | null; displayName: string; avatarFile: { base64: string | null } | null } | null
        } | null
      } | null> | null
    }
  }
}

export type CreateBulkCsvTaskMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvTaskMutation {
  createBulkCSVTask: { tasks: Array<{ id: string }> | null }
}

export type UserTasksQueryVariables = Exact<{
  where?: Types.TaskWhereInput | null | undefined
}>

export interface UserTasksQuery {
  tasks: { edges: Array<{ node: { id: string; displayID: string; title: string; due: string | null } | null } | null> | null }
}

export type UpdateBulkTaskMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateTaskInput
}>

export interface UpdateBulkTaskMutation {
  updateBulkTask: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type UpdateTaskCommentMutationVariables = Exact<{
  updateTaskCommentId: string
  input: Types.UpdateNoteInput
}>

export interface UpdateTaskCommentMutation {
  updateTaskComment: { task: { id: string } }
}

export type DeleteBulkTaskMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkTaskMutation {
  deleteBulkTask: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetOverdueTaskCountQueryVariables = Exact<{
  now: string
}>

export interface GetOverdueTaskCountQuery {
  tasks: { totalCount: number }
}

export type TaskTemplatesQueryVariables = Exact<{
  where?: Types.TaskWhereInput | null | undefined
  orderBy?: Array<Types.TaskOrder> | Types.TaskOrder | null | undefined
  first?: number | null | undefined
}>

export interface TaskTemplatesQuery {
  tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; taskKindName: string | null; tags: Array<string> | null } | null } | null> | null }
}

export type GetTaskAssociationsQueryVariables = Exact<{
  taskId: string
}>

export interface GetTaskAssociationsQuery {
  task: {
    subcontrols: { edges: Array<{ node: { id: string; refCode: string; controlID: string; description: string | null; displayID: string; referenceFramework: string | null } | null } | null> | null }
    controls: { edges: Array<{ node: { id: string; refCode: string; description: string | null; displayID: string; referenceFramework: string | null } | null } | null> | null }
    risks: { edges: Array<{ node: { id: string; name: string; details: string | null; displayID: string } | null } | null> | null }
    programs: { edges: Array<{ node: { id: string; displayID: string; description: string | null; name: string } | null } | null> | null }
    procedures: { edges: Array<{ node: { id: string; displayID: string; name: string; summary: string | null } | null } | null> | null }
    internalPolicies: { edges: Array<{ node: { id: string; displayID: string; name: string; summary: string | null } | null } | null> | null }
    evidence: { edges: Array<{ node: { id: string; displayID: string; description: string | null; name: string } | null } | null> | null }
    groups: { edges: Array<{ node: { id: string; displayID: string; description: string | null; name: string } | null } | null> | null }
    controlObjectives: {
      edges: Array<{
        node: { id: string; displayID: string; name: string; desiredOutcome: string | null; controls: { edges: Array<{ node: { id: string } | null } | null> | null } } | null
      } | null> | null
    }
  }
}

export type CreateTemplateMutationVariables = Exact<{
  input: Types.CreateTemplateInput
}>

export interface CreateTemplateMutation {
  createTemplate: { template: { id: string; name: string; templateType: Types.TemplateDocumentType; description: string | null; jsonconfig: any; uischema: any; owner: { id: string } | null } }
}

export type UpdateTemplateMutationVariables = Exact<{
  updateTemplateId: string
  input: Types.UpdateTemplateInput
  templateFiles?: Array<any> | any | null | undefined
}>

export interface UpdateTemplateMutation {
  updateTemplate: { template: { id: string; name: string; templateType: Types.TemplateDocumentType; description: string | null; jsonconfig: any; uischema: any; owner: { id: string } | null } }
}

export type FilterTemplatesQueryVariables = Exact<{
  where?: Types.TemplateWhereInput | null | undefined
  orderBy?: Array<Types.TemplateOrder> | Types.TemplateOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface FilterTemplatesQuery {
  templates: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        templateType: Types.TemplateDocumentType
        description: string | null
        jsonconfig: any
        uischema: any
        createdAt: any
        updatedAt: any
        updatedBy: string | null
        createdBy: string | null
        environmentName: string | null
        kind: Types.TemplateTemplateKind | null
        scopeName: string | null
        systemOwned: boolean | null
        tags: Array<string> | null
        transformConfiguration: any
        owner: { id: string; displayName: string } | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type GetTemplateQueryVariables = Exact<{
  getTemplateId: string
}>

export interface GetTemplateQuery {
  template: { id: string; templateType: Types.TemplateDocumentType; name: string; description: string | null; jsonconfig: any; uischema: any; systemOwned: boolean | null }
}

export type DeleteTemplateMutationVariables = Exact<{
  deleteTemplateId: string
}>

export interface DeleteTemplateMutation {
  deleteTemplate: { deletedID: string }
}

export type SearchTemplatesQueryVariables = Exact<{
  query: string
}>

export interface SearchTemplatesQuery {
  templateSearch: {
    totalCount: number
    edges: Array<{
      node: { id: string; name: string; templateType: Types.TemplateDocumentType; description: string | null; jsonconfig: any; uischema: any; createdAt: any; updatedAt: any } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any }
  } | null
}

export type CreateBulkCsvTemplateMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvTemplateMutation {
  createBulkCSVTemplate: { templates: Array<{ id: string }> | null }
}

export type GetTfaSettingsQueryVariables = Exact<{ [key: string]: never }>

export interface GetTfaSettingsQuery {
  tfaSettings: { edges: Array<{ node: { id: string } | null } | null> | null }
}

export type GetUserTfaSettingsQueryVariables = Exact<{
  userId: string
}>

export interface GetUserTfaSettingsQuery {
  user: { tfaSettings: { edges: Array<{ node: { id: string; totpAllowed: boolean | null; verified: boolean } | null } | null> | null } }
}

export type UpdateTfaSettingMutationVariables = Exact<{
  input: Types.UpdateTfaSettingInput
}>

export interface UpdateTfaSettingMutation {
  updateTFASetting: { qrCode: string | null; recoveryCodes: Array<string> | null; tfaSecret: string | null; tfaSetting: { id: string } }
}

export type CreateTfaSettingMutationVariables = Exact<{
  input: Types.CreateTfaSettingInput
}>

export interface CreateTfaSettingMutation {
  createTFASetting: { qrCode: string | null; tfaSecret: string | null; tfaSetting: { id: string } }
}

export type CreatePersonalAccessTokenMutationVariables = Exact<{
  input: Types.CreatePersonalAccessTokenInput
}>

export interface CreatePersonalAccessTokenMutation {
  createPersonalAccessToken: { personalAccessToken: { id: string; token: string } }
}

export type GetPersonalAccessTokensQueryVariables = Exact<{
  where?: Types.PersonalAccessTokenWhereInput | null | undefined
  orderBy?: Array<Types.PersonalAccessTokenOrder> | Types.PersonalAccessTokenOrder | null | undefined
}>

export interface GetPersonalAccessTokensQuery {
  personalAccessTokens: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        name: string
        description: string | null
        expiresAt: any
        lastUsedAt: any
        ssoAuthorizations: any
        organizations: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { startCursor: any; endCursor: any }
  }
}

export type DeletePersonalAccessTokenMutationVariables = Exact<{
  deletePersonalAccessTokenId: string
}>

export interface DeletePersonalAccessTokenMutation {
  deletePersonalAccessToken: { deletedID: string }
}

export type CreateApiTokenMutationVariables = Exact<{
  input: Types.CreateApiTokenInput
}>

export interface CreateApiTokenMutation {
  createAPIToken: { apiToken: { id: string; token: string } }
}

export type GetApiTokensQueryVariables = Exact<{
  where?: Types.ApiTokenWhereInput | null | undefined
  orderBy?: Array<Types.ApiTokenOrder> | Types.ApiTokenOrder | null | undefined
}>

export interface GetApiTokensQuery {
  apiTokens: {
    totalCount: number
    edges: Array<{ node: { id: string; name: string; description: string | null; scopes: Array<string> | null; expiresAt: any; lastUsedAt: any; ssoAuthorizations: any } | null } | null> | null
    pageInfo: { startCursor: any; endCursor: any }
  }
}

export type DeleteApiTokenMutationVariables = Exact<{
  deleteAPITokenId: string
}>

export interface DeleteApiTokenMutation {
  deleteAPIToken: { deletedID: string }
}

export type GetApiTokensByIdsQueryVariables = Exact<{
  where?: Types.ApiTokenWhereInput | null | undefined
  orderBy?: Array<Types.ApiTokenOrder> | Types.ApiTokenOrder | null | undefined
}>

export interface GetApiTokensByIdsQuery {
  apiTokens: { edges: Array<{ node: { id: string; name: string } | null } | null> | null }
}

export type UpdateApiTokenMutationVariables = Exact<{
  updateApiTokenId: string
  input: Types.UpdateApiTokenInput
}>

export interface UpdateApiTokenMutation {
  updateAPIToken: { apiToken: { id: string } }
}

export type UpdatePersonalAccessTokenMutationVariables = Exact<{
  updatePersonalAccessTokenId: string
  input: Types.UpdatePersonalAccessTokenInput
}>

export interface UpdatePersonalAccessTokenMutation {
  updatePersonalAccessToken: { personalAccessToken: { id: string } }
}

export type GetTrustCenterCompliancesQueryVariables = Exact<{ [key: string]: never }>

export interface GetTrustCenterCompliancesQuery {
  trustCenterCompliances: {
    edges: Array<{ node: { id: string; standard: { id: string; shortName: string | null; description: string | null; tags: Array<string> | null; systemOwned: boolean | null } } | null } | null> | null
  }
}

export type CreateBulkTrustCenterComplianceMutationVariables = Exact<{
  input?: Array<Types.CreateTrustCenterComplianceInput> | Types.CreateTrustCenterComplianceInput | null | undefined
}>

export interface CreateBulkTrustCenterComplianceMutation {
  createBulkTrustCenterCompliance: { trustCenterCompliances: Array<{ id: string }> | null }
}

export type DeleteBulkTrustCenterComplianceMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkTrustCenterComplianceMutation {
  deleteBulkTrustCenterCompliance: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateTrustCenterComplianceMutationVariables = Exact<{
  updateTrustCenterComplianceId: string
  input: Types.UpdateTrustCenterComplianceInput
}>

export interface UpdateTrustCenterComplianceMutation {
  updateTrustCenterCompliance: { trustCenterCompliance: { id: string } }
}

export type GetTrustCenterDocsQueryVariables = Exact<{
  where?: Types.TrustCenterDocWhereInput | null | undefined
  first?: number | null | undefined
  orderBy?: Array<Types.TrustCenterDocOrder> | Types.TrustCenterDocOrder | null | undefined
  after?: any
  before?: any
  last?: number | null | undefined
}>

export interface GetTrustCenterDocsQuery {
  trustCenters: {
    edges: Array<{
      node: {
        id: string
        trustCenterDocs: {
          totalCount: number
          edges: Array<{
            node: {
              id: string
              title: string
              trustCenterDocKindName: string | null
              visibility: Types.TrustCenterDocTrustCenterDocumentVisibility | null
              tags: Array<string> | null
              createdAt: any
              updatedAt: any
              watermarkingEnabled: boolean | null
              watermarkStatus: Types.TrustCenterDocWatermarkStatus | null
              file: { presignedURL: string | null } | null
              originalFile: { presignedURL: string | null } | null
              standard: { shortName: string | null; id: string } | null
            } | null
          } | null> | null
          pageInfo: { endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean; startCursor: any }
        }
      } | null
    } | null> | null
  }
}

export type UpdateTrustCenterDocMutationVariables = Exact<{
  updateTrustCenterDocId: string
  input: Types.UpdateTrustCenterDocInput
  trustCenterDocFile?: any
}>

export interface UpdateTrustCenterDocMutation {
  updateTrustCenterDoc: { trustCenterDoc: { id: string } }
}

export type CreateTrustCenterDocMutationVariables = Exact<{
  input: Types.CreateTrustCenterDocInput
  trustCenterDocFile: any
}>

export interface CreateTrustCenterDocMutation {
  createTrustCenterDoc: { trustCenterDoc: { id: string } }
}

export type GetTruestCenterDocByIdQueryVariables = Exact<{
  trustCenterDocId: string
}>

export interface GetTruestCenterDocByIdQuery {
  trustCenterDoc: {
    id: string
    title: string
    trustCenterDocKindName: string | null
    visibility: Types.TrustCenterDocTrustCenterDocumentVisibility | null
    tags: Array<string> | null
    watermarkingEnabled: boolean | null
    watermarkStatus: Types.TrustCenterDocWatermarkStatus | null
    standardID: string | null
    file: { presignedURL: string | null; providedFileName: string; providedFileSize: number | null } | null
    originalFile: { presignedURL: string | null; providedFileSize: number | null; providedFileName: string } | null
  }
}

export type DeleteTrustCenterDocMutationVariables = Exact<{
  deleteTrustCenterDocId: string
}>

export interface DeleteTrustCenterDocMutation {
  deleteTrustCenterDoc: { deletedID: string }
}

export type BulkDeleteTrustCenterDocMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface BulkDeleteTrustCenterDocMutation {
  deleteBulkTrustCenterDoc: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type BulkUpdateTrustCenterDocMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateTrustCenterDocInput
}>

export interface BulkUpdateTrustCenterDocMutation {
  updateBulkTrustCenterDoc: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetTrustCenterEntitiesQueryVariables = Exact<{
  where?: Types.TrustCenterEntityWhereInput | null | undefined
}>

export interface GetTrustCenterEntitiesQuery {
  trustCenterEntities: { edges: Array<{ node: { id: string; name: string; url: string | null; logoFile: { base64: string | null } | null } | null } | null> | null }
}

export type CreateTrustCenterEntityMutationVariables = Exact<{
  input: Types.CreateTrustCenterEntityInput
  logoFile?: any
}>

export interface CreateTrustCenterEntityMutation {
  createTrustCenterEntity: { trustCenterEntity: { id: string } }
}

export type DeleteTrustCenterEntityMutationVariables = Exact<{
  deleteTrustCenterEntityId: string
}>

export interface DeleteTrustCenterEntityMutation {
  deleteTrustCenterEntity: { deletedID: string }
}

export type UpdateTrustCenterEntityMutationVariables = Exact<{
  updateTrustCenterEntityId: string
  input: Types.UpdateTrustCenterEntityInput
  logoFile?: any
}>

export interface UpdateTrustCenterEntityMutation {
  updateTrustCenterEntity: { trustCenterEntity: { id: string } }
}

export type TrustCenterFaQsWithFilterQueryVariables = Exact<{
  where?: Types.TrustCenterFaqWhereInput | null | undefined
  orderBy?: Array<Types.TrustCenterFaqOrder> | Types.TrustCenterFaqOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface TrustCenterFaQsWithFilterQuery {
  trustCenterFAQs: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        displayOrder: number | null
        id: string
        noteID: string
        referenceLink: string | null
        trustCenterID: string | null
        updatedAt: any
        updatedBy: string | null
        note: { title: string | null; text: string }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type TrustCenterFaqQueryVariables = Exact<{
  trustCenterFAQId: string
}>

export interface TrustCenterFaqQuery {
  trustCenterFAQ: {
    createdAt: any
    createdBy: string | null
    displayOrder: number | null
    id: string
    noteID: string
    referenceLink: string | null
    trustCenterID: string | null
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateTrustCenterFaqMutationVariables = Exact<{
  input: Types.CreateTrustCenterFaqInput
}>

export interface CreateTrustCenterFaqMutation {
  createTrustCenterFAQ: { trustCenterFAQ: { id: string } }
}

export type UpdateTrustCenterFaqMutationVariables = Exact<{
  updateTrustCenterFAQId: string
  input: Types.UpdateTrustCenterFaqInput
}>

export interface UpdateTrustCenterFaqMutation {
  updateTrustCenterFAQ: { trustCenterFAQ: { id: string } }
}

export type DeleteTrustCenterFaqMutationVariables = Exact<{
  deleteTrustCenterFAQId: string
}>

export interface DeleteTrustCenterFaqMutation {
  deleteTrustCenterFAQ: { deletedID: string }
}

export type UpdateTrustCenterFaqCommentMutationVariables = Exact<{
  updateTrustCenterFAQCommentId: string
  input: Types.UpdateNoteInput
}>

export interface UpdateTrustCenterFaqCommentMutation {
  updateTrustCenterFAQComment: { trustCenterFAQ: { id: string } }
}

export type CreateBulkCsvTrustCenterFaqMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvTrustCenterFaqMutation {
  createBulkCSVTrustCenterFAQ: { trustCenterFAQs: Array<{ id: string }> | null }
}

export type DeleteBulkTrustCenterFaqMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkTrustCenterFaqMutation {
  deleteBulkTrustCenterFAQ: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkTrustCenterFaqMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateTrustCenterFaqInput
}>

export interface UpdateBulkTrustCenterFaqMutation {
  updateBulkTrustCenterFAQ: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetTrustCenterNdaFilesQueryVariables = Exact<{
  where?: Types.TemplateWhereInput | null | undefined
}>

export interface GetTrustCenterNdaFilesQuery {
  templates: {
    edges: Array<{
      node: { id: string; updatedAt: any; files: { edges: Array<{ node: { providedFileName: string; id: string; presignedURL: string | null; updatedAt: any } | null } | null> | null } } | null
    } | null> | null
  }
}

export type CreateTrustCenterNdaMutationVariables = Exact<{
  input: Types.CreateTrustCenterNdaInput
  templateFiles?: Array<any> | any | null | undefined
}>

export interface CreateTrustCenterNdaMutation {
  createTrustCenterNDA: { template: { id: string } }
}

export type UpdateTrustCenterNdaMutationVariables = Exact<{
  updateTrustCenterNdaId: string
  templateFiles?: Array<any> | any | null | undefined
}>

export interface UpdateTrustCenterNdaMutation {
  updateTrustCenterNDA: { template: { id: string } }
}

export type GetNdaRequestCountQueryVariables = Exact<{
  where?: Types.TrustCenterNdaRequestWhereInput | null | undefined
}>

export interface GetNdaRequestCountQuery {
  trustCenterNdaRequests: { totalCount: number }
}

export type GetTrustCenterNdaRequestsQueryVariables = Exact<{
  after?: any
  first?: number | null | undefined
  before?: any
  last?: number | null | undefined
  orderBy?: Array<Types.TrustCenterNdaRequestOrder> | Types.TrustCenterNdaRequestOrder | null | undefined
  where?: Types.TrustCenterNdaRequestWhereInput | null | undefined
}>

export interface GetTrustCenterNdaRequestsQuery {
  trustCenterNdaRequests: {
    totalCount: number
    pageInfo: { endCursor: any; startCursor: any; hasNextPage: boolean; hasPreviousPage: boolean }
    edges: Array<{
      node: {
        id: string
        firstName: string
        lastName: string
        companyName: string | null
        email: string
        createdAt: any
        approvedAt: string | null
        approvedByUserID: string | null
        signedAt: string | null
        status: Types.TrustCenterNdaRequestTrustCenterNdaRequestStatus | null
        approvedByUser: { id: string; displayName: string; avatarRemoteURL: string | null; avatarFile: { base64: string | null } | null } | null
      } | null
    } | null> | null
  }
}

export type UpdateTrustCenterNdaRequestMutationVariables = Exact<{
  updateTrustCenterNdaRequestId: string
  input: Types.UpdateTrustCenterNdaRequestInput
}>

export interface UpdateTrustCenterNdaRequestMutation {
  updateTrustCenterNDARequest: { trustCenterNDARequest: { id: string } }
}

export type DeleteBulkTrustCenterNdaRequestMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkTrustCenterNdaRequestMutation {
  deleteBulkTrustCenterNDARequest: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetTrustCenterSubprocessorsQueryVariables = Exact<{
  where?: Types.TrustCenterSubprocessorWhereInput | null | undefined
  first?: number | null | undefined
  last?: number | null | undefined
  after?: any
  before?: any
  orderBy?: Array<Types.TrustCenterSubprocessorOrder> | Types.TrustCenterSubprocessorOrder | null | undefined
}>

export interface GetTrustCenterSubprocessorsQuery {
  trustCenterSubprocessors: {
    totalCount: number
    edges: Array<{
      cursor: any
      node: {
        id: string
        trustCenterSubprocessorKindName: string | null
        countries: Array<string> | null
        createdAt: any
        createdBy: string | null
        updatedAt: any
        updatedBy: string | null
        subprocessor: { id: string; name: string; description: string | null; logoRemoteURL: string | null; systemOwned: boolean | null; logoFile: { base64: string | null } | null }
      } | null
    } | null> | null
    pageInfo: { startCursor: any; endCursor: any; hasNextPage: boolean; hasPreviousPage: boolean }
  }
}

export type CreateTrustCenterSubprocessorMutationVariables = Exact<{
  input: Types.CreateTrustCenterSubprocessorInput
}>

export interface CreateTrustCenterSubprocessorMutation {
  createTrustCenterSubprocessor: { trustCenterSubprocessor: { id: string } }
}

export type UpdateTrustCenterSubprocessorMutationVariables = Exact<{
  id: string
  input: Types.UpdateTrustCenterSubprocessorInput
}>

export interface UpdateTrustCenterSubprocessorMutation {
  updateTrustCenterSubprocessor: { trustCenterSubprocessor: { id: string } }
}

export type DeleteBulkTrustCenterSubprocessorsMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkTrustCenterSubprocessorsMutation {
  deleteBulkTrustCenterSubprocessor: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type DeleteTrustCenterSubprocessorMutationVariables = Exact<{
  deleteTrustCenterSubprocessorId: string
}>

export interface DeleteTrustCenterSubprocessorMutation {
  deleteTrustCenterSubprocessor: { deletedID: string }
}

export type GetTrustCenterSubprocessorByIdQueryVariables = Exact<{
  trustCenterSubprocessorId: string
}>

export interface GetTrustCenterSubprocessorByIdQuery {
  trustCenterSubprocessor: {
    id: string
    trustCenterSubprocessorKindName: string | null
    countries: Array<string> | null
    subprocessor: { id: string; name: string; description: string | null; logoRemoteURL: string | null; systemOwned: boolean | null; logoFile: { base64: string | null } | null }
  }
}

export type GetTrustCenterQueryVariables = Exact<{ [key: string]: never }>

export interface GetTrustCenterQuery {
  trustCenters: {
    edges: Array<{
      node: {
        id: string
        slug: string | null
        subprocessorURL: string | null
        pirschDomainID: string | null
        pirschAccessLink: string | null
        customDomain: {
          id: string
          cnameRecord: string
          dnsVerification: { dnsVerificationStatus: Types.DnsVerificationDnsVerificationStatus; dnsTxtRecord: string; dnsTxtValue: string; dnsVerificationStatusReason: string | null } | null
          mappableDomain: { name: string }
        } | null
        previewDomain: { cnameRecord: string } | null
        setting: {
          id: string
          title: string | null
          overview: string | null
          primaryColor: string | null
          themeMode: Types.TrustCenterSettingTrustCenterThemeMode | null
          foregroundColor: string | null
          secondaryForegroundColor: string | null
          font: string | null
          backgroundColor: string | null
          secondaryBackgroundColor: string | null
          accentColor: string | null
          companyName: string | null
          companyDescription: string | null
          companyDomain: string | null
          statusPageURL: string | null
          faviconRemoteURL: string | null
          logoRemoteURL: string | null
          securityContact: string | null
          ndaApprovalRequired: boolean | null
          notifySubscribersOnSubprocessorChange: boolean | null
          allowSubscribers: boolean | null
          ndaApproverGroupID: string | null
          logoFile: { id: string; base64: string | null } | null
          faviconFile: { id: string; base64: string | null } | null
          ndaApproverGroup: { id: string; displayName: string; name: string } | null
        } | null
        previewSetting: {
          id: string
          title: string | null
          overview: string | null
          primaryColor: string | null
          themeMode: Types.TrustCenterSettingTrustCenterThemeMode | null
          foregroundColor: string | null
          secondaryForegroundColor: string | null
          font: string | null
          backgroundColor: string | null
          secondaryBackgroundColor: string | null
          accentColor: string | null
          companyName: string | null
          companyDescription: string | null
          companyDomain: string | null
          statusPageURL: string | null
          faviconRemoteURL: string | null
          logoRemoteURL: string | null
          securityContact: string | null
          updatedAt: any
          logoFile: { id: string; base64: string | null } | null
          faviconFile: { id: string; base64: string | null } | null
        } | null
        watermarkConfig: {
          id: string
          text: string | null
          fontSize: number | null
          color: string | null
          opacity: number | null
          rotation: number | null
          isEnabled: boolean | null
          file: { presignedURL: string | null } | null
        } | null
      } | null
    } | null> | null
  }
}

export type UpdateTrustCenterSettingMutationVariables = Exact<{
  updateTrustCenterSettingId: string
  input: Types.UpdateTrustCenterSettingInput
  faviconFile?: any
  logoFile?: any
}>

export interface UpdateTrustCenterSettingMutation {
  updateTrustCenterSetting: { trustCenterSetting: { id: string; logoRemoteURL: string | null; faviconRemoteURL: string | null; faviconFile: { id: string } | null; logoFile: { id: string } | null } }
}

export type CreateCustomDomainMutationVariables = Exact<{
  input: Types.CreateTrustCenterDomainInput
}>

export interface CreateCustomDomainMutation {
  createTrustCenterDomain: { customDomain: { id: string } }
}

export type DeleteCustomDomainMutationVariables = Exact<{
  deleteCustomDomainId: string
}>

export interface DeleteCustomDomainMutation {
  deleteCustomDomain: { deletedID: string }
}

export type ValidateCustomDomainMutationVariables = Exact<{
  validateCustomDomainId: string
}>

export interface ValidateCustomDomainMutation {
  validateCustomDomain: { customDomain: { id: string; dnsVerification: { dnsVerificationStatus: Types.DnsVerificationDnsVerificationStatus; dnsVerificationStatusReason: string | null } | null } }
}

export type UpdateTrustCenterWatermarkConfigMutationVariables = Exact<{
  updateTrustCenterWatermarkConfigId: string
  input: Types.UpdateTrustCenterWatermarkConfigInput
  watermarkFile?: any
}>

export interface UpdateTrustCenterWatermarkConfigMutation {
  updateTrustCenterWatermarkConfig: { trustCenterWatermarkConfig: { id: string } }
}

export type GetTrustCenterPostsQueryVariables = Exact<{
  trustCenterId: string
  where?: Types.NoteWhereInput | null | undefined
}>

export interface GetTrustCenterPostsQuery {
  trustCenter: { posts: { totalCount: number; edges: Array<{ node: { id: string; text: string; title: string | null; updatedAt: any } | null } | null> | null } }
}

export type UpdateTrustCenterMutationVariables = Exact<{
  updateTrustCenterId: string
  input: Types.UpdateTrustCenterInput
}>

export interface UpdateTrustCenterMutation {
  updateTrustCenter: { trustCenter: { id: string } }
}

export type UpdateTrustCenterPostMutationVariables = Exact<{
  updateTrustCenterPostId: string
  input: Types.UpdateNoteInput
}>

export interface UpdateTrustCenterPostMutation {
  updateTrustCenterPost: { trustCenter: { id: string } }
}

export type TrustCenterLastUpdatedQueryVariables = Exact<{
  trustCenterId: string
}>

export interface TrustCenterLastUpdatedQuery {
  trustCenter: {
    customDomain: { cnameRecord: string; updatedAt: any } | null
    setting: { updatedAt: any } | null
    trustCenterCompliances: { edges: Array<{ node: { updatedAt: any } | null } | null> | null }
    trustCenterSubprocessors: { edges: Array<{ node: { updatedAt: any } | null } | null> | null }
    trustCenterEntities: { edges: Array<{ node: { updatedAt: any } | null } | null> | null }
    trustCenterDocs: { edges: Array<{ node: { updatedAt: any } | null } | null> | null }
    posts: { edges: Array<{ node: { updatedAt: any } | null } | null> | null }
  }
}

export type GetUserProfileQueryVariables = Exact<{
  userId: string
}>

export interface GetUserProfileQuery {
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    displayName: string
    email: string
    avatarRemoteURL: string | null
    avatarFile: { base64: string | null } | null
    setting: {
      id: string
      status: Types.UserSettingUserStatus
      tags: Array<string> | null
      isTfaEnabled: boolean | null
      isWebauthnAllowed: boolean | null
      defaultOrg: { id: string; displayName: string } | null
    }
  }
}

export type UpdateUserMutationVariables = Exact<{
  updateUserId: string
  input: Types.UpdateUserInput
  avatarFile?: any
}>

export interface UpdateUserMutation {
  updateUser: { user: { id: string; avatarFile: { base64: string | null } | null } }
}

export type UpdateUserSettingMutationVariables = Exact<{
  updateUserSettingId: string
  input: Types.UpdateUserSettingInput
}>

export interface UpdateUserSettingMutation {
  updateUserSetting: { userSetting: { id: string } }
}

export type DeleteUserMutationVariables = Exact<{
  deleteUserId: string
}>

export interface DeleteUserMutation {
  deleteUser: { deletedID: string }
}

export type GetVendorDirectoryQueryVariables = Exact<{
  integrationIDs: Array<string> | string
  first?: number | null | undefined
  after?: any
}>

export interface GetVendorDirectoryQuery {
  directoryGroups: {
    totalCount: number
    pageInfo: { endCursor: any; hasNextPage: boolean }
    edges: Array<{
      node: {
        id: string
        displayName: string | null
        email: string | null
        integration: { id: string; name: string }
        members: {
          totalCount: number
          edges: Array<{
            node: {
              id: string
              role: Types.DirectoryMembershipDirectoryMembershipRole | null
              addedAt: any
              removedAt: any
              directoryAccount: {
                id: string
                canonicalEmail: string | null
                displayName: string | null
                givenName: string | null
                familyName: string | null
                identityHolderID: string | null
                identityHolder: { id: string; fullName: string; email: string } | null
              }
            } | null
          } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type VendorRiskScoresWithFilterQueryVariables = Exact<{
  where?: Types.VendorRiskScoreWhereInput | null | undefined
  orderBy?: Array<Types.VendorRiskScoreOrder> | Types.VendorRiskScoreOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface VendorRiskScoresWithFilterQuery {
  vendorRiskScores: {
    totalCount: number
    edges: Array<{
      node: {
        answer: string | null
        assessmentResponseID: string | null
        createdAt: any
        createdBy: string | null
        entityID: string
        id: string
        notes: string | null
        questionDescription: string | null
        questionKey: string
        questionName: string
        score: number
        updatedAt: any
        updatedBy: string | null
        vendorScoringConfigID: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type VendorRiskScoreQueryVariables = Exact<{
  vendorRiskScoreId: string
}>

export interface VendorRiskScoreQuery {
  vendorRiskScore: {
    answer: string | null
    assessmentResponseID: string | null
    createdAt: any
    createdBy: string | null
    entityID: string
    id: string
    notes: string | null
    questionDescription: string | null
    questionKey: string
    questionName: string
    score: number
    updatedAt: any
    updatedBy: string | null
    vendorScoringConfigID: string | null
  }
}

export type CreateVendorRiskScoreMutationVariables = Exact<{
  input: Types.CreateVendorRiskScoreInput
}>

export interface CreateVendorRiskScoreMutation {
  createVendorRiskScore: { vendorRiskScore: { id: string } }
}

export type UpdateVendorRiskScoreMutationVariables = Exact<{
  updateVendorRiskScoreId: string
  input: Types.UpdateVendorRiskScoreInput
}>

export interface UpdateVendorRiskScoreMutation {
  updateVendorRiskScore: { vendorRiskScore: { id: string } }
}

export type DeleteVendorRiskScoreMutationVariables = Exact<{
  deleteVendorRiskScoreId: string
}>

export interface DeleteVendorRiskScoreMutation {
  deleteVendorRiskScore: { deletedID: string }
}

export type CreateBulkCsvVendorRiskScoreMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvVendorRiskScoreMutation {
  createBulkCSVVendorRiskScore: { vendorRiskScores: Array<{ id: string }> | null }
}

export type DeleteBulkVendorRiskScoreMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkVendorRiskScoreMutation {
  deleteBulkVendorRiskScore: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkVendorRiskScoreMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateVendorRiskScoreInput
}>

export interface UpdateBulkVendorRiskScoreMutation {
  updateBulkVendorRiskScore: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type VendorScoringConfigsWithFilterQueryVariables = Exact<{
  where?: Types.VendorScoringConfigWhereInput | null | undefined
  orderBy?: Array<Types.VendorScoringConfigOrder> | Types.VendorScoringConfigOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface VendorScoringConfigsWithFilterQuery {
  vendorScoringConfigs: {
    totalCount: number
    edges: Array<{ node: { createdAt: any; createdBy: string | null; id: string; questions: any; riskThresholds: any; updatedAt: any; updatedBy: string | null } | null } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type VendorScoringConfigQueryVariables = Exact<{
  vendorScoringConfigId: string
}>

export interface VendorScoringConfigQuery {
  vendorScoringConfig: { createdAt: any; createdBy: string | null; id: string; questions: any; riskThresholds: any; updatedAt: any; updatedBy: string | null }
}

export type CreateVendorScoringConfigMutationVariables = Exact<{
  input: Types.CreateVendorScoringConfigInput
}>

export interface CreateVendorScoringConfigMutation {
  createVendorScoringConfig: { vendorScoringConfig: { id: string } }
}

export type UpdateVendorScoringConfigMutationVariables = Exact<{
  updateVendorScoringConfigId: string
  input: Types.UpdateVendorScoringConfigInput
}>

export interface UpdateVendorScoringConfigMutation {
  updateVendorScoringConfig: { vendorScoringConfig: { id: string } }
}

export type DeleteVendorScoringConfigMutationVariables = Exact<{
  deleteVendorScoringConfigId: string
}>

export interface DeleteVendorScoringConfigMutation {
  deleteVendorScoringConfig: { deletedID: string }
}

export type CreateBulkCsvVendorScoringConfigMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvVendorScoringConfigMutation {
  createBulkCSVVendorScoringConfig: { vendorScoringConfigs: Array<{ id: string }> | null }
}

export type DeleteBulkVendorScoringConfigMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkVendorScoringConfigMutation {
  deleteBulkVendorScoringConfig: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type UpdateBulkVendorScoringConfigMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateVendorScoringConfigInput
}>

export interface UpdateBulkVendorScoringConfigMutation {
  updateBulkVendorScoringConfig: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type VulnerabilitiesCountQueryVariables = Exact<{
  where?: Types.VulnerabilityWhereInput | null | undefined
}>

export interface VulnerabilitiesCountQuery {
  vulnerabilities: { totalCount: number }
}

export type VulnerabilitiesWithFilterQueryVariables = Exact<{
  where?: Types.VulnerabilityWhereInput | null | undefined
  orderBy?: Array<Types.VulnerabilityOrder> | Types.VulnerabilityOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface VulnerabilitiesWithFilterQuery {
  vulnerabilities: {
    totalCount: number
    edges: Array<{
      node: {
        assignedToUserID: string | null
        blocking: boolean | null
        category: string | null
        createdAt: any
        createdBy: string | null
        cveID: string | null
        description: string | null
        discoveredAt: string | null
        dismissedAt: string | null
        dismissedReason: string | null
        displayID: string
        displayName: string | null
        environmentID: string | null
        environmentName: string | null
        exploitability: number | null
        externalID: string
        externalOwnerID: string | null
        externalURI: string | null
        firstPatchedVersion: string | null
        id: string
        impact: number | null
        metadata: any
        open: boolean | null
        packageEcosystem: string | null
        packageName: string | null
        priority: string | null
        production: boolean | null
        public: boolean | null
        publishedAt: string | null
        rawPayload: any
        remediationSLA: number | null
        scopeID: string | null
        scopeName: string | null
        score: number | null
        securityLevel: Types.VulnerabilitySecurityLevel | null
        severity: string | null
        source: string | null
        sourceUpdatedAt: string | null
        summary: string | null
        systemOwned: boolean | null
        tags: Array<string> | null
        impacts: Array<string> | null
        references: Array<string> | null
        updatedAt: any
        updatedBy: string | null
        validated: boolean | null
        vector: string | null
        vulnerabilityStatusName: string | null
        vulnerableVersionRange: string | null
        remediations: { totalCount: number; edges: Array<{ node: { id: string } | null } | null> | null }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type VulnerabilityQueryVariables = Exact<{
  vulnerabilityId: string
}>

export interface VulnerabilityQuery {
  vulnerability: {
    assignedToUserID: string | null
    blocking: boolean | null
    category: string | null
    createdAt: any
    createdBy: string | null
    cveID: string | null
    description: string | null
    discoveredAt: string | null
    dismissedAt: string | null
    dismissedComment: string | null
    dismissedReason: string | null
    displayID: string
    displayName: string | null
    environmentID: string | null
    environmentName: string | null
    exploitability: number | null
    externalID: string
    externalOwnerID: string | null
    externalURI: string | null
    firstPatchedVersion: string | null
    id: string
    impact: number | null
    metadata: any
    open: boolean | null
    packageEcosystem: string | null
    packageName: string | null
    priority: string | null
    production: boolean | null
    public: boolean | null
    publishedAt: string | null
    rawPayload: any
    remediationSLA: number | null
    scopeID: string | null
    scopeName: string | null
    score: number | null
    securityLevel: Types.VulnerabilitySecurityLevel | null
    severity: string | null
    source: string | null
    sourceUpdatedAt: string | null
    summary: string | null
    systemOwned: boolean | null
    tags: Array<string> | null
    impacts: Array<string> | null
    references: Array<string> | null
    updatedAt: any
    updatedBy: string | null
    validated: boolean | null
    vector: string | null
    vulnerabilityStatusName: string | null
    vulnerableVersionRange: string | null
    integrations: { totalCount: number }
    remediations: { totalCount: number; edges: Array<{ node: { id: string } | null } | null> | null }
  }
}

export type CreateVulnerabilityMutationVariables = Exact<{
  input: Types.CreateVulnerabilityInput
}>

export interface CreateVulnerabilityMutation {
  createVulnerability: { vulnerability: { id: string } }
}

export type UpdateVulnerabilityMutationVariables = Exact<{
  updateVulnerabilityId: string
  input: Types.UpdateVulnerabilityInput
}>

export interface UpdateVulnerabilityMutation {
  updateVulnerability: { vulnerability: { id: string } }
}

export type DeleteVulnerabilityMutationVariables = Exact<{
  deleteVulnerabilityId: string
}>

export interface DeleteVulnerabilityMutation {
  deleteVulnerability: { deletedID: string }
}

export type CreateBulkCsvVulnerabilityMutationVariables = Exact<{
  input: any
}>

export interface CreateBulkCsvVulnerabilityMutation {
  createBulkCSVVulnerability: { vulnerabilities: Array<{ id: string }> | null }
}

export type DeleteBulkVulnerabilityMutationVariables = Exact<{
  ids: Array<string> | string
}>

export interface DeleteBulkVulnerabilityMutation {
  deleteBulkVulnerability: { deletedIDs: Array<string>; notDeletedIDs: Array<string>; error: string | null }
}

export type GetVulnerabilityAssociationsQueryVariables = Exact<{
  vulnerabilityId: string
}>

export interface GetVulnerabilityAssociationsQuery {
  vulnerability: {
    controls: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; description: string | null; displayID: string } | null } | null> | null }
    subcontrols: { totalCount: number; edges: Array<{ node: { id: string; refCode: string; displayID: string } | null } | null> | null }
    findings: { totalCount: number; edges: Array<{ node: { id: string; displayName: string | null; displayID: string } | null } | null> | null }
    remediations: { totalCount: number; edges: Array<{ node: { id: string; title: string | null; displayID: string } | null } | null> | null }
    reviews: { totalCount: number; edges: Array<{ node: { id: string; title: string } | null } | null> | null }
    assets: { totalCount: number; edges: Array<{ node: { id: string; name: string; displayName: string | null } | null } | null> | null }
    tasks: { totalCount: number; edges: Array<{ node: { id: string; title: string; displayID: string } | null } | null> | null }
  }
}

export type UpdateBulkVulnerabilityMutationVariables = Exact<{
  ids: Array<string> | string
  input: Types.UpdateVulnerabilityInput
}>

export interface UpdateBulkVulnerabilityMutation {
  updateBulkVulnerability: { updatedIDs: Array<string> | null; notUpdatedIDs: Array<string>; error: string | null }
}

export type GetVulnerabilityAssociationsTimelineQueryVariables = Exact<{
  vulnerabilityId: string
}>

export interface GetVulnerabilityAssociationsTimelineQuery {
  vulnerability: {
    controls: { edges: Array<{ node: { id: string; displayID: string; refCode: string; createdAt: any } | null } | null> | null }
    risks: { edges: Array<{ node: { id: string; name: string; displayID: string; createdAt: any; createdBy: string | null } | null } | null> | null }
    findings: { edges: Array<{ node: { id: string; displayName: string | null; displayID: string; createdAt: any; source: string | null } | null } | null> | null }
    assets: { edges: Array<{ node: { id: string; name: string; displayName: string | null; createdAt: any } | null } | null> | null }
    scans: { edges: Array<{ node: { id: string; target: string; createdAt: any; createdBy: string | null } | null } | null> | null }
    remediations: { edges: Array<{ node: { id: string; title: string | null; displayID: string; createdAt: any } | null } | null> | null }
  }
}

export type WorkflowAssignmentTargetsWithFilterQueryVariables = Exact<{
  where?: Types.WorkflowAssignmentTargetWhereInput | null | undefined
  orderBy?: Array<Types.WorkflowAssignmentTargetOrder> | Types.WorkflowAssignmentTargetOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface WorkflowAssignmentTargetsWithFilterQuery {
  workflowAssignmentTargets: {
    totalCount: number
    edges: Array<{
      node: {
        createdAt: any
        createdBy: string | null
        displayID: string
        id: string
        resolverKey: string | null
        targetGroupID: string | null
        targetUserID: string | null
        updatedAt: any
        updatedBy: string | null
        workflowAssignmentID: string
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type WorkflowAssignmentTargetQueryVariables = Exact<{
  workflowAssignmentTargetId: string
}>

export interface WorkflowAssignmentTargetQuery {
  workflowAssignmentTarget: {
    createdAt: any
    createdBy: string | null
    displayID: string
    id: string
    resolverKey: string | null
    targetGroupID: string | null
    targetUserID: string | null
    updatedAt: any
    updatedBy: string | null
    workflowAssignmentID: string
  }
}

export type WorkflowAssignmentsWithFilterQueryVariables = Exact<{
  where?: Types.WorkflowAssignmentWhereInput | null | undefined
  orderBy?: Array<Types.WorkflowAssignmentOrder> | Types.WorkflowAssignmentOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface WorkflowAssignmentsWithFilterQuery {
  workflowAssignments: {
    totalCount: number
    edges: Array<{
      node: {
        actorGroupID: string | null
        actorUserID: string | null
        approvalMetadata: any
        assignmentKey: string
        createdAt: any
        createdBy: string | null
        decidedAt: any
        displayID: string
        dueAt: any
        id: string
        invalidationMetadata: any
        label: string | null
        metadata: any
        notes: string | null
        rejectionMetadata: any
        required: boolean
        role: string
        status: Types.WorkflowAssignmentWorkflowAssignmentStatus
        updatedAt: any
        updatedBy: string | null
        workflowInstanceID: string
        workflowInstance: {
          id: string
          state: Types.WorkflowInstanceWorkflowInstanceState
          context: any
          controlID: string | null
          subcontrolID: string | null
          evidenceID: string | null
          internalPolicyID: string | null
          procedureID: string | null
          definitionSnapshot: any
          workflowDefinition: { id: string; name: string; schemaType: string; workflowKind: Types.WorkflowDefinitionWorkflowKind; definitionJSON: any }
        }
        workflowAssignmentTargets: {
          totalCount: number
          edges: Array<{
            node: { id: string; targetType: Types.WorkflowAssignmentTargetWorkflowTargetType; targetUserID: string | null; targetGroupID: string | null; resolverKey: string | null } | null
          } | null> | null
        }
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type WorkflowAssignmentQueryVariables = Exact<{
  workflowAssignmentId: string
}>

export interface WorkflowAssignmentQuery {
  workflowAssignment: {
    actorGroupID: string | null
    actorUserID: string | null
    approvalMetadata: any
    assignmentKey: string
    createdAt: any
    createdBy: string | null
    decidedAt: any
    displayID: string
    dueAt: any
    id: string
    invalidationMetadata: any
    label: string | null
    metadata: any
    notes: string | null
    rejectionMetadata: any
    required: boolean
    role: string
    updatedAt: any
    updatedBy: string | null
    workflowInstanceID: string
  }
}

export type WorkflowDefinitionsWithFilterQueryVariables = Exact<{
  where?: Types.WorkflowDefinitionWhereInput | null | undefined
  orderBy?: Array<Types.WorkflowDefinitionOrder> | Types.WorkflowDefinitionOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface WorkflowDefinitionsWithFilterQuery {
  workflowDefinitions: {
    totalCount: number
    edges: Array<{
      node: {
        active: boolean
        cooldownSeconds: number
        createdAt: any
        createdBy: string | null
        definitionJSON: any
        description: string | null
        displayID: string
        draft: boolean
        id: string
        isDefault: boolean
        name: string
        publishedAt: any
        revision: number
        schemaType: string
        workflowKind: Types.WorkflowDefinitionWorkflowKind
        systemOwned: boolean | null
        updatedAt: any
        updatedBy: string | null
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type WorkflowDefinitionQueryVariables = Exact<{
  workflowDefinitionId: string
}>

export interface WorkflowDefinitionQuery {
  workflowDefinition: {
    active: boolean
    cooldownSeconds: number
    createdAt: any
    createdBy: string | null
    definitionJSON: any
    description: string | null
    displayID: string
    draft: boolean
    id: string
    isDefault: boolean
    name: string
    publishedAt: any
    revision: number
    schemaType: string
    systemOwned: boolean | null
    workflowKind: Types.WorkflowDefinitionWorkflowKind
    updatedAt: any
    updatedBy: string | null
  }
}

export type CreateWorkflowDefinitionMutationVariables = Exact<{
  input: Types.CreateWorkflowDefinitionInput
}>

export interface CreateWorkflowDefinitionMutation {
  createWorkflowDefinition: { workflowDefinition: { id: string } }
}

export type UpdateWorkflowDefinitionMutationVariables = Exact<{
  updateWorkflowDefinitionId: string
  input: Types.UpdateWorkflowDefinitionInput
}>

export interface UpdateWorkflowDefinitionMutation {
  updateWorkflowDefinition: { workflowDefinition: { id: string } }
}

export type DeleteWorkflowDefinitionMutationVariables = Exact<{
  deleteWorkflowDefinitionId: string
}>

export interface DeleteWorkflowDefinitionMutation {
  deleteWorkflowDefinition: { deletedID: string }
}

export type WorkflowEventsWithFilterQueryVariables = Exact<{
  where?: Types.WorkflowEventWhereInput | null | undefined
  orderBy?: Array<Types.WorkflowEventOrder> | Types.WorkflowEventOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface WorkflowEventsWithFilterQuery {
  workflowEvents: {
    totalCount: number
    edges: Array<{
      node: { createdAt: any; createdBy: string | null; displayID: string; id: string; payload: any; updatedAt: any; updatedBy: string | null; workflowInstanceID: string } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type WorkflowEventQueryVariables = Exact<{
  workflowEventId: string
}>

export interface WorkflowEventQuery {
  workflowEvent: { createdAt: any; createdBy: string | null; displayID: string; id: string; payload: any; updatedAt: any; updatedBy: string | null; workflowInstanceID: string }
}

export type WorkflowInstancesWithFilterQueryVariables = Exact<{
  where?: Types.WorkflowInstanceWhereInput | null | undefined
  orderBy?: Array<Types.WorkflowInstanceOrder> | Types.WorkflowInstanceOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface WorkflowInstancesWithFilterQuery {
  workflowInstances: {
    totalCount: number
    edges: Array<{
      node: {
        id: string
        state: Types.WorkflowInstanceWorkflowInstanceState
        context: any
        definitionSnapshot: any
        createdAt: any
        updatedAt: any
        workflowProposalID: string | null
        workflowDefinition: { id: string; name: string; schemaType: string; workflowKind: Types.WorkflowDefinitionWorkflowKind; definitionJSON: any }
        workflowAssignments: {
          edges: Array<{
            node: {
              id: string
              status: Types.WorkflowAssignmentWorkflowAssignmentStatus
              assignmentKey: string
              label: string | null
              metadata: any
              createdAt: any
              decidedAt: any
              actorUserID: string | null
              actorGroupID: string | null
            } | null
          } | null> | null
        }
      } | null
    } | null> | null
  }
}

export type WorkflowInstanceQueryVariables = Exact<{
  workflowInstanceId: string
}>

export interface WorkflowInstanceQuery {
  workflowInstance: {
    actionPlanID: string | null
    campaignID: string | null
    campaignTargetID: string | null
    context: any
    controlID: string | null
    createdAt: any
    createdBy: string | null
    currentActionIndex: number
    definitionSnapshot: any
    displayID: string
    evidenceID: string | null
    id: string
    identityHolderID: string | null
    internalPolicyID: string | null
    lastEvaluatedAt: any
    platformID: string | null
    procedureID: string | null
    subcontrolID: string | null
    updatedAt: any
    updatedBy: string | null
    workflowDefinitionID: string
    workflowProposalID: string | null
  }
}

export type WorkflowObjectRefsWithFilterQueryVariables = Exact<{
  where?: Types.WorkflowObjectRefWhereInput | null | undefined
  orderBy?: Array<Types.WorkflowObjectRefOrder> | Types.WorkflowObjectRefOrder | null | undefined
  first?: number | null | undefined
  after?: any
  last?: number | null | undefined
  before?: any
}>

export interface WorkflowObjectRefsWithFilterQuery {
  workflowObjectRefs: {
    totalCount: number
    edges: Array<{
      node: {
        actionPlanID: string | null
        campaignID: string | null
        campaignTargetID: string | null
        controlID: string | null
        createdAt: any
        createdBy: string | null
        directoryAccountID: string | null
        directoryGroupID: string | null
        directoryMembershipID: string | null
        displayID: string
        evidenceID: string | null
        findingID: string | null
        id: string
        identityHolderID: string | null
        internalPolicyID: string | null
        platformID: string | null
        procedureID: string | null
        subcontrolID: string | null
        taskID: string | null
        updatedAt: any
        updatedBy: string | null
        workflowInstanceID: string
      } | null
    } | null> | null
    pageInfo: { endCursor: any; startCursor: any; hasPreviousPage: boolean; hasNextPage: boolean }
  }
}

export type WorkflowObjectRefQueryVariables = Exact<{
  workflowObjectRefId: string
}>

export interface WorkflowObjectRefQuery {
  workflowObjectRef: {
    actionPlanID: string | null
    campaignID: string | null
    campaignTargetID: string | null
    controlID: string | null
    createdAt: any
    createdBy: string | null
    directoryAccountID: string | null
    directoryGroupID: string | null
    directoryMembershipID: string | null
    displayID: string
    evidenceID: string | null
    findingID: string | null
    id: string
    identityHolderID: string | null
    internalPolicyID: string | null
    platformID: string | null
    procedureID: string | null
    subcontrolID: string | null
    taskID: string | null
    updatedAt: any
    updatedBy: string | null
    workflowInstanceID: string
  }
}

export type WorkflowProposalQueryVariables = Exact<{
  workflowProposalId: string
}>

export interface WorkflowProposalQuery {
  workflowProposal: {
    approvedHash: string | null
    changes: any
    createdAt: any
    createdBy: string | null
    domainKey: string
    id: string
    proposedHash: string | null
    revision: number
    submittedAt: any
    submittedByUserID: string | null
    updatedAt: any
    updatedBy: string | null
    workflowObjectRefID: string
  }
}

export type WorkflowMetadataQueryVariables = Exact<{ [key: string]: never }>

export interface WorkflowMetadataQuery {
  workflowMetadata: {
    objectTypes: Array<{
      type: string
      label: string
      description: string
      resolverKeys: Array<string>
      eligibleEdges: Array<string>
      eligibleFields: Array<{ name: string; label: string; type: string }>
    }>
  }
}

export type GetWorkflowProposalsForObjectQueryVariables = Exact<{
  objectType: string
  objectID: string
  includeStates?: Array<Types.WorkflowProposalState> | Types.WorkflowProposalState | null | undefined
}>

export interface GetWorkflowProposalsForObjectQuery {
  workflowProposalsForObject: Array<{
    id: string
    state: Types.WorkflowProposalWorkflowProposalState
    domainKey: string
    revision: number
    changes: any
    createdAt: any
    updatedAt: any
    submittedAt: any
  }>
}

export type ApproveWorkflowAssignmentMutationVariables = Exact<{
  id: string
}>

export interface ApproveWorkflowAssignmentMutation {
  approveWorkflowAssignment: { workflowAssignment: { id: string; status: Types.WorkflowAssignmentWorkflowAssignmentStatus; decidedAt: any } }
}

export type RejectWorkflowAssignmentMutationVariables = Exact<{
  id: string
  reason?: string | null | undefined
}>

export interface RejectWorkflowAssignmentMutation {
  rejectWorkflowAssignment: { workflowAssignment: { id: string; status: Types.WorkflowAssignmentWorkflowAssignmentStatus; decidedAt: any } }
}

export type RequestChangesWorkflowAssignmentMutationVariables = Exact<{
  id: string
  reason?: string | null | undefined
  inputs?: any
}>

export interface RequestChangesWorkflowAssignmentMutation {
  requestChangesWorkflowAssignment: { workflowAssignment: { id: string; status: Types.WorkflowAssignmentWorkflowAssignmentStatus; decidedAt: any } }
}

export type ReassignWorkflowAssignmentMutationVariables = Exact<{
  id: string
  targetUserID: string
}>

export interface ReassignWorkflowAssignmentMutation {
  reassignWorkflowAssignment: { id: string; status: Types.WorkflowAssignmentWorkflowAssignmentStatus; assignmentKey: string }
}
