import { z } from 'zod'
import { type Group } from '@repo/codegen/src/schema'
import { type Option } from '@repo/ui/multiple-selector'
import { InternalPolicyStatusOptions, ProcedureStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { ControlStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { RiskLikelihoodOptions, RiskStatusOptions } from '../enum-mapper/risk-enum'
import { TaskStatusOptions } from '../enum-mapper/task-enum'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { EvidenceStatusOptions } from '../enum-mapper/evidence-enum'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { buildMutationKey } from '@/components/shared/object-association/utils'

export type BulkEditRisksDialogProps = {
  selectedRisks: { id: string }[]
  setSelectedRisks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditPoliciesDialogProps = {
  selectedPolicies: { id: string }[]
  setSelectedPolicies: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditProceduresDialogProps = {
  selectedProcedures: { id: string }[]
  setSelectedProcedures: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditControlsDialogProps = {
  selectedControls: { id: string; refCode: string }[]
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
}

export type BulkEditTasksDialogProps = {
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditEvidenceDialogProps = {
  selectedEvidence: { id: string }[]
  setSelectedEvidence: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditAssetsDialogProps = {
  selectedAssets: { id: string }[]
  setSelectedAssets: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export interface BulkEditDialogFormValues {
  fieldsArray: FieldItem[]
}

export interface SelectOptionSelectedObject<T extends string = string> {
  selectOptionEnum: T
  name: string
  placeholder: string
  options?: Option[]
  inputType: InputType
  objectType?: ObjectTypeObjects
}

export enum SelectOptionBulkEditControls {
  Status = 'Status',
  ControlType = 'Control type',
  ControlOwner = 'Control owner',
  Program = 'Program',
  Category = 'Category',
  SubCategory = 'Subcategory',
  Tags = 'Tags',
}

export enum SelectOptionBulkEditPolicies {
  Status = 'Status',
  PolicyType = 'Policy type',
  PolicyApprover = 'Approver',
  PolicyDelegate = 'Delegate',
  Tags = 'Tags',
}

export enum SelectOptionBulkEditProcedures {
  Status = 'Status',
  ProcedureType = 'Procedure type',
  ProcedureApprover = 'Approver',
  ProcedureDelegate = 'Delegate',
  Tags = 'Tags',
}

export enum SelectOptionBulkEditRisks {
  Status = 'Status',
  RiskType = 'Risk type',
  RiskStakeholder = 'Stakeholder',
  RiskDelegate = 'Delegate',
  RiskCategory = 'Category',
  RiskScore = 'Score',
  RiskLikelihood = 'Likelihood',
  Tags = 'Tags',
}

export enum SelectOptionBulkEditTasks {
  Status = 'Status',
  TaskAssignee = 'Assignee',
  DueDate = 'Due date',
  TaskCategory = 'Type',
  Tags = 'Tags',
}

export enum SelectOptionBulkEditEvidence {
  Status = 'Status',
  Tags = 'Tags',
  Source = 'Source',
}

export enum SelectOptionBulkEditAssets {
  Tags = 'Tags',
}

export type SelectOptionBulkEdit =
  | SelectOptionBulkEditControls
  | SelectOptionBulkEditPolicies
  | SelectOptionBulkEditProcedures
  | SelectOptionBulkEditRisks
  | SelectOptionBulkEditTasks
  | SelectOptionBulkEditEvidence
  | SelectOptionBulkEditAssets

export enum InputType {
  Select = 'SELECT',
  Input = 'INPUT',
  Date = 'DATETIME',
  Tag = 'TAG',
  TypeAhead = 'TYPE_AHEAD',
  ObjectAssociation = 'OBJECT_ASSOCIATION',
}

export interface FieldItem {
  value: string | undefined
  selectedObject?: SelectOptionSelectedObject
  selectedValue?: string | string[] | undefined
  selectedDate?: Date | null
  selectedAssociations?: TObjectAssociationMap
}

export const defaultObject = {
  fieldsArray: [],
}

export const fieldItemSchema = z.object({
  value: z.string().optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.string(),
      name: z.string(),
      placeholder: z.string(),
      inputType: z.nativeEnum(InputType),
      options: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
      objectType: z.nativeEnum(ObjectTypeObjects).optional(),
    })
    .optional(),
  selectedValue: z.union([z.string(), z.array(z.string())]).optional(),
  selectedDate: z.date().nullable().optional(),
  selectedAssociations: z.record(z.string(), z.array(z.string())).optional(),
})

export const bulkEditFieldsSchema = z.object({
  fieldsArray: z.array(fieldItemSchema),
})

export type BulkEditFieldsFormValues = z.infer<typeof bulkEditFieldsSchema>

const clearValueMap: Record<string, string> = {
  procedureType: 'clearObjectTypes.PROCEDURE',
  policyType: 'clearPolicyType',
  riskType: 'clearRiskType',
  score: 'clearScore',
  category: 'clearCategory',
  due: 'clearDue',
  clearSource: 'clearSource',
  clearTags: 'clearTags',
}

export const getMappedClearValue = (key: string): string => {
  return clearValueMap[key]
}

type BulkEditFieldLike = {
  selectedObject?: { inputType: InputType } | undefined
  selectedValue?: string | string[] | undefined
  selectedAssociations?: Record<string, string[]> | undefined
}

export const collectAssociationInput = (field: BulkEditFieldLike, input: Record<string, string | string[] | boolean>): boolean => {
  if (field.selectedObject?.inputType !== InputType.ObjectAssociation || !field.selectedAssociations) {
    return false
  }
  Object.entries(field.selectedAssociations).forEach(([key, associationIds]) => {
    if (associationIds && associationIds.length > 0) {
      input[buildMutationKey('add', key)] = associationIds
    }
  })
  return true
}

export const checkHasFieldsToUpdate = (watchedFields: BulkEditFieldLike[]): boolean => {
  return watchedFields.some(
    (field) =>
      (field.selectedObject && field.selectedValue) ||
      field.selectedObject?.inputType === InputType.Input ||
      (field.selectedObject?.inputType === InputType.ObjectAssociation && field.selectedAssociations && Object.values(field.selectedAssociations).some((ids) => ids && ids.length > 0)),
  )
}

const POLICY_ALLOWED_OBJECT_TYPES = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.RISK] as const
const CONTROL_ALLOWED_OBJECT_TYPES = [ObjectTypeObjects.INTERNAL_POLICY, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.RISK] as const
const RISK_ALLOWED_OBJECT_TYPES = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.INTERNAL_POLICY] as const
const EVIDENCE_ALLOWED_OBJECT_TYPES = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.CONTROL_IMPLEMENTATION, ObjectTypeObjects.SCAN] as const

const ASSOCIATION_DISPLAY_NAMES: Partial<Record<ObjectTypeObjects, string>> = {
  [ObjectTypeObjects.CONTROL]: 'Associate Controls',
  [ObjectTypeObjects.INTERNAL_POLICY]: 'Associate Policies',
  [ObjectTypeObjects.PROCEDURE]: 'Associate Procedures',
  [ObjectTypeObjects.RISK]: 'Associate Risks',
  [ObjectTypeObjects.SUB_CONTROL]: 'Associate Subcontrols',
  [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: 'Associate Control Implementations',
  [ObjectTypeObjects.SCAN]: 'Associate Scans',
}

export const generateAssociationSelectOptions = (allowedTypes: readonly ObjectTypeObjects[]): SelectOptionSelectedObject[] => {
  return allowedTypes.map((objectType) => ({
    selectOptionEnum: ASSOCIATION_DISPLAY_NAMES[objectType] ?? objectType,
    name: 'objectAssociation',
    inputType: InputType.ObjectAssociation,
    placeholder: 'Select associations',
    objectType,
  }))
}

export const getAssociationSelectedCount = (selectedAssociations?: Record<string, string[]>): number => {
  if (!selectedAssociations) return 0
  return Object.values(selectedAssociations).reduce((sum, ids) => sum + (ids?.length ?? 0), 0)
}

export const getAllSelectOptionsForBulkEditRisks = (groups: Group[], typeOptions: Option[], categoryOptions: Option[]): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskDelegate,
      name: 'delegateID',
      inputType: InputType.Select,
      placeholder: 'Select delegate',
      options: groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.Status,
      name: 'status',
      inputType: InputType.Select,
      placeholder: 'Select a status',
      options: RiskStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskLikelihood,
      name: 'likelihood',
      inputType: InputType.Select,
      placeholder: 'Select likelihood',
      options: RiskLikelihoodOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskType,
      name: 'riskKindName',
      inputType: InputType.Select,
      placeholder: 'Select a risk type',
      options: typeOptions,
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskStakeholder,
      name: 'stakeholderID',
      inputType: InputType.Select,
      placeholder: 'Select stakeholder',
      options: groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskCategory,
      name: 'riskCategoryName',
      inputType: InputType.Select,
      placeholder: 'Select category',
      options: categoryOptions,
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskScore,
      name: 'score',
      inputType: InputType.Input,
      placeholder: 'Select score',
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.Tags,
      name: 'appendTags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
    ...generateAssociationSelectOptions(RISK_ALLOWED_OBJECT_TYPES),
  ]
}

export const getAllSelectOptionsForBulkEditProcedures = (groups: Group[], typeOptions: Option[]): SelectOptionSelectedObject<SelectOptionBulkEditProcedures>[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditProcedures.ProcedureDelegate,
      name: 'delegateID',
      inputType: InputType.Select,
      placeholder: 'Select delegate',
      options: groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditProcedures.Status,
      name: 'status',
      inputType: InputType.Select,
      placeholder: 'Select a status',
      options: ProcedureStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditProcedures.ProcedureType,
      name: 'procedureKindName',
      inputType: InputType.Select,
      placeholder: 'Select a procedure type',
      options: typeOptions,
    },
    {
      selectOptionEnum: SelectOptionBulkEditProcedures.ProcedureApprover,
      name: 'approverID',
      inputType: InputType.Select,
      placeholder: 'Select approver',
      options: groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditProcedures.Tags,
      name: 'appendTags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
  ]
}

export const getAllSelectOptionsForBulkEditPolicies = (groups: Group[], typeOptions: Option[]): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditPolicies.PolicyDelegate,
      name: 'delegateID',
      inputType: InputType.Select,
      placeholder: 'Select delegate',
      options: groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditPolicies.Status,
      name: 'status',
      inputType: InputType.Select,
      placeholder: 'Select a status',
      options: InternalPolicyStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditPolicies.PolicyType,
      name: 'internalPolicyKindName',
      inputType: InputType.Select,
      placeholder: 'Select a policy type',
      options: typeOptions,
    },
    {
      selectOptionEnum: SelectOptionBulkEditPolicies.PolicyApprover,
      name: 'approverID',
      inputType: InputType.Select,
      placeholder: 'Select approver',
      options: groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditPolicies.Tags,
      name: 'appendTags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
    ...generateAssociationSelectOptions(POLICY_ALLOWED_OBJECT_TYPES),
  ]
}

export const useGetAllSelectOptionsForBulkEditControls = (groups: Group[], typeOptions: Option[]): SelectOptionSelectedObject[] => {
  const { programOptions } = useProgramSelect({})

  return [
    {
      selectOptionEnum: SelectOptionBulkEditControls.ControlOwner,
      name: 'controlOwnerID',
      placeholder: 'Select owner',
      inputType: InputType.Select,
      options: groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditControls.Status,
      name: 'status',
      placeholder: 'Select a status',
      inputType: InputType.Select,
      options: ControlStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditControls.ControlType,
      name: 'controlKindName',
      placeholder: 'Select a control type',
      inputType: InputType.Select,
      options: typeOptions,
    },
    {
      selectOptionEnum: SelectOptionBulkEditControls.Program,
      name: 'addProgramIDs',
      placeholder: 'Select program...',
      inputType: InputType.Select,
      options: programOptions || [],
    },
    {
      selectOptionEnum: SelectOptionBulkEditControls.Category,
      name: 'category',
      inputType: InputType.TypeAhead,
      placeholder: 'Input category',
    },
    {
      selectOptionEnum: SelectOptionBulkEditControls.SubCategory,
      name: 'subcategory',
      inputType: InputType.TypeAhead,
      placeholder: 'Input subcategory',
    },
    {
      selectOptionEnum: SelectOptionBulkEditControls.Tags,
      name: 'appendTags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
    ...generateAssociationSelectOptions(CONTROL_ALLOWED_OBJECT_TYPES),
  ]
}

export const getAllSelectOptionsForBulkEditTasks = (
  membersOptions:
    | {
        value: string | undefined
        label: string
      }[]
    | undefined,
  taskKindOptions: { value: string; label: string }[],
): SelectOptionSelectedObject<SelectOptionBulkEditTasks>[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditTasks.TaskAssignee,
      name: 'assigneeID',
      placeholder: 'Select assignee',
      inputType: InputType.Select,
      options: membersOptions?.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditTasks.Status,
      name: 'status',
      placeholder: 'Select a status',
      inputType: InputType.Select,
      options: TaskStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditTasks.DueDate,
      name: 'due',
      placeholder: 'Select a due date',
      inputType: InputType.Date,
    },
    {
      selectOptionEnum: SelectOptionBulkEditTasks.TaskCategory,
      name: 'taskKindName',
      inputType: InputType.Select,
      placeholder: 'Select category',
      options: taskKindOptions,
    },
    {
      selectOptionEnum: SelectOptionBulkEditTasks.Tags,
      name: 'appendTags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
  ]
}

export const getAllSelectOptionsForBulkEditEvidence = (): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditEvidence.Status,
      name: 'status',
      placeholder: 'Select a status',
      inputType: InputType.Select,
      options: EvidenceStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditEvidence.Source,
      name: 'source',
      inputType: InputType.Input,
      placeholder: 'Input source',
    },
    {
      selectOptionEnum: SelectOptionBulkEditEvidence.Tags,
      name: 'appendTags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
    ...generateAssociationSelectOptions(EVIDENCE_ALLOWED_OBJECT_TYPES),
  ]
}
export const getAllSelectOptionsForBulkEditAssets = (): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditAssets.Tags,
      name: 'appendTags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
  ]
}
