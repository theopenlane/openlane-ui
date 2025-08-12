import { Group } from '@repo/codegen/src/schema'
import { Option } from '@repo/ui/multiple-selector'
import { InternalPolicyStatusOptions, ProcedureStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { ControlStatusOptions, ControlControlTypeOptions } from '@/components/shared/enum-mapper/control-enum'
import { RiskLikelihoodOptions, RiskStatusOptions } from '../enum-mapper/risk-enum'

export type BulkEditDialogPropsBase = {
  setIsBulkEditing: React.Dispatch<React.SetStateAction<boolean>>
}

export type BulkEditRisksDialogProps = BulkEditDialogPropsBase & {
  selectedRisks: { id: string }[]
  setSelectedRisks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditPoliciesDialogProps = BulkEditDialogPropsBase & {
  selectedPolicies: { id: string }[]
  setSelectedPolicies: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditProceduresDialogProps = BulkEditDialogPropsBase & {
  selectedProcedures: { id: string }[]
  setSelectedProcedures: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditControlsDialogProps = BulkEditDialogPropsBase & {
  selectedControls: { id: string; refCode: string }[]
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
}

export interface BulkEditDialogFormValues {
  fieldsArray: FieldItem[]
}

export interface SelectOptionSelectedObject {
  selectOptionEnum: SelectOptionBulkEditControls | SelectOptionBulkEditPolicies | SelectOptionBulkEditProcedures | SelectOptionBulkEditRisks
  name: string
  placeholder: string
  options?: Option[]
  inputType: InputType
}

export enum SelectOptionBulkEditControls {
  Status = 'Status',
  ControlType = 'Control type',
  ControlOwner = 'Control owner',
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

export enum InputType {
  Select = 'SELECT',
  Input = 'INPUT',
}

export interface FieldItem {
  value: SelectOptionBulkEditControls | SelectOptionBulkEditPolicies | SelectOptionBulkEditProcedures | SelectOptionBulkEditRisks | undefined
  selectedObject?: SelectOptionSelectedObject
  selectedValue: string | undefined
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
}

export const getMappedClearValue = (key: string): string => {
  return clearValueMap[key]
}

export const getAllSelectOptionsForBulkEditRisks = (groups: Group[]): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskDelegate,
      name: 'delegateID',
      inputType: InputType.Select,
      placeholder: 'Select delegate',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
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
      name: 'riskType',
      inputType: InputType.Input,
      placeholder: 'Select a risk type',
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskStakeholder,
      name: 'stakeholderID',
      inputType: InputType.Select,
      placeholder: 'Select stakeholder',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskCategory,
      name: 'category',
      inputType: InputType.Input,
      placeholder: 'Select category',
    },
    {
      selectOptionEnum: SelectOptionBulkEditRisks.RiskScore,
      name: 'score',
      inputType: InputType.Input,
      placeholder: 'Select score',
    },
  ]
}

export const getAllSelectOptionsForBulkEditProcedures = (groups: Group[]): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditProcedures.ProcedureDelegate,
      name: 'delegateID',
      inputType: InputType.Select,
      placeholder: 'Select delegate',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
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
      name: 'procedureType',
      inputType: InputType.Input,
      placeholder: 'Select a procedure type',
    },
    {
      selectOptionEnum: SelectOptionBulkEditProcedures.ProcedureApprover,
      name: 'approverID',
      inputType: InputType.Select,
      placeholder: 'Select approver',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
    },
  ]
}

export const getAllSelectOptionsForBulkEditPolicies = (groups: Group[]): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditPolicies.PolicyDelegate,
      name: 'delegateID',
      inputType: InputType.Select,
      placeholder: 'Select delegate',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
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
      name: 'policyType',
      inputType: InputType.Input,
      placeholder: 'Select a policy type',
    },
    {
      selectOptionEnum: SelectOptionBulkEditPolicies.PolicyApprover,
      name: 'approverID',
      inputType: InputType.Select,
      placeholder: 'Select approver',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
    },
  ]
}

export const getAllSelectOptionsForBulkEditControls = (groups: Group[]): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOptionBulkEditControls.ControlOwner,
      name: 'controlOwnerID',
      placeholder: 'Select owner',
      inputType: InputType.Select,
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
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
      name: 'controlType',
      placeholder: 'Select a control type',
      inputType: InputType.Select,
      options: ControlControlTypeOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
  ]
}
