import { Group } from '@repo/codegen/src/schema'
import { Option } from '@repo/ui/multiple-selector'
import { InternalPolicyStatusOptions, ProcedureStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { ControlStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { RiskLikelihoodOptions, RiskStatusOptions } from '../enum-mapper/risk-enum'
import { TaskStatusOptions } from '../enum-mapper/task-enum'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { EvidenceStatusOptions } from '../enum-mapper/evidence-enum'

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

export interface BulkEditDialogFormValues {
  fieldsArray: FieldItem[]
}

export interface SelectOptionSelectedObject {
  selectOptionEnum: SelectOptionBulkEditControls | SelectOptionBulkEditPolicies | SelectOptionBulkEditProcedures | SelectOptionBulkEditRisks | SelectOptionBulkEditTasks | SelectOptionBulkEditEvidence
  name: string
  placeholder: string
  options?: Option[]
  inputType: InputType
}

export enum SelectOptionBulkEditControls {
  Status = 'Status',
  ControlType = 'Control type',
  ControlOwner = 'Control owner',
  Program = 'Program',
}

export enum SelectOptionBulkEditPolicies {
  Status = 'Status',
  PolicyType = 'Policy type',
  PolicyApprover = 'Approver',
  PolicyDelegate = 'Delegate',
}

export enum SelectOptionBulkEditProcedures {
  Status = 'Status',
  ProcedureType = 'Procedure type',
  ProcedureApprover = 'Approver',
  ProcedureDelegate = 'Delegate',
}

export enum SelectOptionBulkEditRisks {
  Status = 'Status',
  RiskType = 'Procedure type',
  RiskStakeholder = 'Stakeholder',
  RiskDelegate = 'Delegate',
  RiskCategory = 'Category',
  RiskScore = 'Score',
  RiskLikelihood = 'Likelihood',
}

export enum SelectOptionBulkEditTasks {
  Status = 'Status',
  TaskAssignee = 'Assignee',
  DueDate = 'Due date',
  TaskCategory = 'Type',
}

export enum SelectOptionBulkEditEvidence {
  Status = 'Status',
  Tags = 'Tags',
  Source = 'Source',
}

export enum InputType {
  Select = 'SELECT',
  Input = 'INPUT',
  Date = 'DATETIME',
  Tag = 'TAG',
}

export interface FieldItem {
  value: SelectOptionBulkEditControls | SelectOptionBulkEditPolicies | SelectOptionBulkEditProcedures | SelectOptionBulkEditRisks | SelectOptionBulkEditTasks | SelectOptionBulkEditEvidence | undefined
  selectedObject?: SelectOptionSelectedObject
  selectedValue?: string | undefined
  selectedDate?: Date | null
}

export const defaultObject = {
  fieldsArray: [],
}

const clearValueMap: Record<string, string> = {
  procedureType: 'clearProcedureType',
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
  ]
}

export const getAllSelectOptionsForBulkEditProcedures = (groups: Group[], typeOptions: Option[]): SelectOptionSelectedObject[] => {
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
): SelectOptionSelectedObject[] => {
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
      name: 'tags',
      inputType: InputType.Tag,
      placeholder: 'Add a tag',
    },
  ]
}
