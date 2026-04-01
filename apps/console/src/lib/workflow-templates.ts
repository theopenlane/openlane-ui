export type WorkflowTemplateCategory = 'approval' | 'notification' | 'lifecycle'

export type WorkflowTemplate = {
  id: string
  name: string
  description: string
  category: WorkflowTemplateCategory
  schemaType: string
  definitionJSON: definitionJSON
  highlights?: string[]
}

type definitionJSON = {
  name: string
  description: string
  schemaType: string
  workflowKind: string
  version: string
  triggers: [
    {
      operation: string
      objectType: string
      fields?: string[]
      edges?: string[]
      expression?: string
      description?: string
    },
  ]
  conditions?: { expression: string; description?: string }[]
  actions: {
    key: string
    type: string
    description?: string
    when?: string
    params: {
      targets?: {
        type: string
        id?: string
        resolver_key?: string
      }[]
      required?: boolean
      required_count?: number
      label?: string
      fields?: string[]
      updates?: Record<string, unknown>
      title?: string
      body?: string
      channels?: string[]
      url?: string
      method?: string
      headers?: Record<string, string>
      payload?: Record<string, unknown>
      timeout_ms?: number
      data?: Record<string, unknown>
    }
  }[]
  metadata?: Record<string, unknown>
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'multi-step-control-approval',
    name: 'Multi-Step Control Approval',
    description: 'Sequential approvals for different control fields.',
    category: 'approval',
    schemaType: 'Control',
    highlights: ['Trigger: status or category changes', 'Actions: 2 approvals', 'Sequential gates'],
    definitionJSON: {
      name: 'Multi-Step Control Approval',
      description: 'Sequential approvals for different control fields',
      schemaType: 'Control',
      workflowKind: 'APPROVAL',
      version: '1.0',
      triggers: [
        {
          operation: 'UPDATE',
          objectType: 'Control',
          fields: ['category', 'status'],
          description: 'Triggered on control category or status updates',
        },
      ],
      conditions: [],
      actions: [
        {
          key: 'technical-review',
          type: 'REQUEST_APPROVAL',
          description: 'Category review by engineering team',
          when: "'category' in changed_fields",
          params: {
            targets: [{ type: 'GROUP', id: '<ENGINEERING_GROUP_ID>' }],
            required: true,
            label: 'Category review',
            fields: ['category'],
          },
        },
        {
          key: 'compliance-review',
          type: 'REQUEST_APPROVAL',
          description: 'Final approval by compliance team',
          when: "'status' in changed_fields",
          params: {
            targets: [{ type: 'GROUP', id: '<COMPLIANCE_GROUP_ID>' }],
            required: true,
            label: 'Compliance approval',
            fields: ['status'],
          },
        },
      ],
      metadata: {
        author: 'Openlane',
        category: 'compliance',
        reviewChain: ['engineering', 'compliance'],
      },
    },
  },
  {
    id: 'control-approval-with-notifications',
    name: 'Control Status Approval with Notifications',
    description: 'Request approval and notify the creator on approval or rejection.',
    category: 'approval',
    schemaType: 'Control',
    highlights: ['Approval action', 'Notify on approved/rejected', 'Control status changes'],
    definitionJSON: {
      name: 'Control Status Approval with Notifications',
      description: 'Requires manager approval for control status changes and sends notifications based on approval outcome',
      schemaType: 'Control',
      workflowKind: 'APPROVAL',
      version: '1.0.0',
      triggers: [
        {
          operation: 'UPDATE',
          objectType: 'Control',
          fields: ['status'],
          expression: "'status' in changed_fields",
        },
      ],
      conditions: [
        {
          expression: 'object.status != "NOT_IMPLEMENTED"',
          description: 'Only trigger for controls that are being implemented',
        },
      ],
      actions: [
        {
          key: 'manager_approval',
          type: 'REQUEST_APPROVAL',
          description: 'Request approval from control owner',
          params: {
            targets: [{ type: 'RESOLVER', resolver_key: 'CONTROL_OWNER' }],
            required: true,
            label: 'Control Status Change Approval',
            fields: ['status'],
          },
        },
        {
          key: 'notify_creator_approved',
          type: 'NOTIFY',
          description: 'Notify the object creator when the request is approved',
          when: 'assignments.by_action["manager_approval"].status == "APPROVED"',
          params: {
            targets: [{ type: 'RESOLVER', resolver_key: 'OBJECT_CREATOR' }],
            title: 'Control Status Change Approved',
            body: 'Your request to change the status of control {{object_id}} has been approved.',
            channels: ['IN_APP'],
          },
        },
        {
          key: 'notify_creator_rejected',
          type: 'NOTIFY',
          description: 'Notify the object creator when the request is rejected',
          when: 'assignments.by_action["manager_approval"].rejected > 0',
          params: {
            targets: [{ type: 'RESOLVER', resolver_key: 'OBJECT_CREATOR' }],
            title: 'Control Status Change Rejected',
            body: 'Your request to change the status of control {{object_id}} has been rejected. Please contact your control owner for details.',
            channels: ['IN_APP'],
          },
        },
        {
          key: 'notify_delegate_on_rejection',
          type: 'NOTIFY',
          description: 'Notify the governance group when a request is rejected for visibility',
          when: 'assignments.rejected > 0',
          params: {
            targets: [{ type: 'GROUP', id: '<REPLACE_WITH_GROUP_ID>' }],
            title: 'Control Change Request Rejected',
            body: 'A control status change request for {{object_id}} was rejected.',
            channels: ['IN_APP'],
          },
        },
      ],
    },
  },
  {
    id: 'multi-approver-quorum-notifications',
    name: 'Multi-Approver Review with Quorum Notifications',
    description: 'Require multiple approvers and notify at key milestones.',
    category: 'approval',
    schemaType: 'Control',
    highlights: ['Quorum approval', 'Notify first approval', 'Notify quorum reached'],
    definitionJSON: {
      name: 'Multi-Approver Review with Quorum Notifications',
      description: 'Requires multiple approvers with notifications at each milestone',
      schemaType: 'Control',
      workflowKind: 'APPROVAL',
      version: '1.0.0',
      triggers: [
        {
          operation: 'UPDATE',
          objectType: 'Control',
          fields: ['status', 'category'],
          expression: "'status' in changed_fields || 'category' in changed_fields",
        },
      ],
      actions: [
        {
          key: 'team_review',
          type: 'REQUEST_APPROVAL',
          description: 'Request approval from control owner and responsible party (quorum 2)',
          params: {
            targets: [
              { type: 'RESOLVER', resolver_key: 'CONTROL_OWNER' },
              { type: 'RESOLVER', resolver_key: 'RESPONSIBLE_PARTY' },
            ],
            required: true,
            required_count: 2,
            label: 'Team Review',
            fields: ['status', 'category'],
          },
        },
        {
          key: 'notify_first_approval',
          type: 'NOTIFY',
          description: 'Notify when the first approval is received',
          when: 'assignments.by_action["team_review"].approved == 1 && assignments.by_action["team_review"].pending > 0',
          params: {
            targets: [{ type: 'RESOLVER', resolver_key: 'OBJECT_CREATOR' }],
            title: 'First Approval Received',
            body: 'A control change request has received 1 approval. Waiting for 1 more approval to reach quorum.',
            channels: ['IN_APP'],
          },
        },
        {
          key: 'notify_quorum_reached',
          type: 'NOTIFY',
          description: 'Notify when quorum is reached and approval is complete',
          when: 'assignments.by_action["team_review"].approved >= 2',
          params: {
            targets: [
              { type: 'RESOLVER', resolver_key: 'OBJECT_CREATOR' },
              { type: 'RESOLVER', resolver_key: 'CONTROL_OWNER' },
            ],
            title: 'Quorum Reached - Changes Approved',
            body: 'The control change request for {{object_id}} has been approved with {{assignments.by_action["team_review"].approved}} approvals.',
            channels: ['IN_APP'],
            data: {
              approval_count: '{{assignments.by_action["team_review"].approved}}',
              instance_id: '{{instance_id}}',
            },
          },
        },
        {
          key: 'notify_rejection',
          type: 'NOTIFY',
          description: 'Notify all stakeholders on rejection',
          when: 'assignments.by_action["team_review"].rejected > 0',
          params: {
            targets: [
              { type: 'RESOLVER', resolver_key: 'OBJECT_CREATOR' },
              { type: 'RESOLVER', resolver_key: 'CONTROL_OWNER' },
            ],
            title: 'Control Change Request Rejected',
            body: 'The control change request for {{object_id}} has been rejected. Please review and resubmit if needed.',
            channels: ['IN_APP'],
          },
        },
      ],
    },
  },
  {
    id: 'evidence-review-edge-trigger',
    name: 'Evidence Review - Edge Trigger',
    description: 'Objects linked together.',
    category: 'approval',
    schemaType: 'Evidence',
    highlights: ['Edge trigger: Evidence attached to controls', 'Approval + webhook', 'Evidence schema'],
    definitionJSON: {
      name: 'Evidence Review (Edge Trigger)',
      description: 'Objects linked together.',
      schemaType: 'Evidence',
      workflowKind: 'APPROVAL',
      version: '1.0',
      triggers: [
        {
          operation: 'UPDATE',
          objectType: 'Evidence',
          edges: ['controls'],
          description: 'Triggered when evidence is linked to a control',
        },
      ],
      conditions: [
        {
          expression: "'controls' in changed_edges && size(added_ids['controls']) > 0",
          description: 'Only when controls are added',
        },
      ],
      actions: [
        {
          key: 'evidence_review',
          type: 'REQUEST_APPROVAL',
          description: 'Request reviewer approval after evidence is attached to a control',
          params: {
            targets: [{ type: 'GROUP', id: '<REPLACE_WITH_REVIEWER_GROUP_ID>' }],
            required: true,
            label: 'Evidence review',
            fields: ['workflow_eligible_marker'],
          },
        },
        {
          key: 'notify_review_complete',
          type: 'WEBHOOK',
          description: 'Notify external systems after review is approved',
          params: {
            url: '<REPLACE_WITH_WEBHOOK_URL>',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            payload: { text: 'Evidence review completed for {{object_id}}' },
            timeout_ms: 5000,
          },
        },
      ],
      metadata: {
        author: 'Openlane',
        category: 'evidence',
      },
    },
  },
  {
    id: 'control-webhook-notification',
    name: 'Control Slack Webhook Alert',
    description: 'Send a webhook when a control status changes to APPROVED.',
    category: 'notification',
    schemaType: 'Control',
    highlights: ['Post-commit notification', 'Trigger: status approved', 'Action: webhook'],
    definitionJSON: {
      name: 'Control Slack Webhook Alert',
      description: 'Send a Slack webhook when a control status is approved',
      schemaType: 'Control',
      workflowKind: 'NOTIFICATION',
      version: '1.0',
      triggers: [
        {
          operation: 'UPDATE',
          objectType: 'Control',
          fields: ['status'],
          description: 'Triggered when control status changes',
        },
      ],
      conditions: [
        {
          expression: '\'status\' in changed_fields && object.status == "APPROVED"',
          description: 'Only fire when status transitions to APPROVED',
        },
      ],
      actions: [
        {
          key: 'slack_webhook',
          type: 'WEBHOOK',
          description: 'Post a Slack message with control details',
          params: {
            url: '<REPLACE_WITH_SLACK_WEBHOOK_URL>',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            payload: { text: 'Control status approved. Control details are included in the payload.' },
            timeout_ms: 5000,
          },
        },
      ],
      metadata: {
        author: 'Openlane',
        category: 'notifications',
      },
    },
  },
  {
    id: 'control-field-update-lifecycle',
    name: 'Control Auto-Enrichment - Field Update',
    description: 'Automatically update fields when status reaches Approved.',
    category: 'lifecycle',
    schemaType: 'Control',
    highlights: ['Field update action', 'Trigger: status approved', 'Optional notification'],
    definitionJSON: {
      name: 'Control Auto-Enrichment Workflow',
      description: 'Automatically updates control metadata and notifies stakeholders',
      schemaType: 'Control',
      workflowKind: 'LIFECYCLE',
      version: '1.0.0',
      triggers: [
        {
          operation: 'UPDATE',
          objectType: 'Control',
          fields: ['status'],
          description: 'Triggered when control status changes',
        },
      ],
      conditions: [
        {
          expression: '\'status\' in changed_fields && object.status == "APPROVED"',
          description: 'Only when status transitions to APPROVED',
        },
      ],
      actions: [
        {
          key: 'auto_enrich_control',
          type: 'FIELD_UPDATE',
          description: 'Update metadata fields automatically',
          params: {
            updates: {
              category: 'Reviewed - Automated',
              reference_framework: 'SOC 2',
            },
          },
        },
        {
          key: 'notify_owner',
          type: 'NOTIFY',
          description: 'Notify the control owner that fields were updated',
          params: {
            targets: [{ type: 'RESOLVER', resolver_key: 'CONTROL_OWNER' }],
            title: 'Control auto-enriched',
            body: 'Workflow {{instance_id}} updated control {{object_id}} fields.',
            channels: ['IN_APP'],
          },
        },
      ],
      metadata: {
        author: 'Openlane',
        category: 'lifecycle',
      },
    },
  },
]

export const TRIGGER_OPERATION_OPTIONS = [
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
]

export const getWorkflowTemplateById = (id: string) => WORKFLOW_TEMPLATES.find((template) => template.id === id)
