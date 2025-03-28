import { FilterField } from '@/types'
import { OrderDirection } from '@repo/codegen/src/schema.ts'

export const PROCEDURE_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'background', label: 'Background', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'displayID', label: 'Display ID', type: 'text' },
  { key: 'hasBlockedGroups', label: 'Has Blocked Groups', type: 'boolean' },
  { key: 'hasControls', label: 'Has Controls', type: 'boolean' },
  { key: 'hasEditors', label: 'Has Editors', type: 'boolean' },
  { key: 'hasInternalPolicies', label: 'Has Internal Policies', type: 'boolean' },
  { key: 'hasNarratives', label: 'Has Narratives', type: 'boolean' },
  { key: 'hasPrograms', label: 'Has Programs', type: 'boolean' },
  { key: 'hasRisks', label: 'Has Risks', type: 'boolean' },
  { key: 'hasTasks', label: 'Has Tasks', type: 'boolean' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'procedureType', label: 'Type', type: 'text' },
  { key: 'purposeAndScope', label: 'Purpose and Scope', type: 'text' },
  { key: 'reviewDue', label: 'Review Due', type: 'date' },
  { key: 'satisfies', label: 'Satisfies', type: 'date' },
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'version', label: 'Version', type: 'text' },

  { key: 'createdAt', label: 'Date Created', type: 'date' },
  { key: 'createdBy', label: 'Created By', type: 'text' },
  { key: 'updatedAt', label: 'Date Updated', type: 'date' },
  { key: 'updatedBy', label: 'Updated By', type: 'text' },
]

export const PROCEDURE_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
    default: {
      key: 'name',
      direction: OrderDirection.DESC,
    },
  },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]
