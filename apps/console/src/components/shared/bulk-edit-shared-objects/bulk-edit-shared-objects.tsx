import { Group } from '@repo/codegen/src/schema'
import { Option } from '@repo/ui/multiple-selector'
import { InternalPolicyStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { ControlStatusOptions, ControlControlTypeOptions } from '@/components/shared/enum-mapper/control-enum'

export type BulkEditDialogPropsBase = {
  setIsBulkEditing: React.Dispatch<React.SetStateAction<boolean>>
}

export type BulkEditPoliciesDialogProps = BulkEditDialogPropsBase & {
  selectedPolicies: { id: string }[]
  setSelectedPolicies: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export type BulkEditControlsDialogProps = BulkEditDialogPropsBase & {
  selectedControls: { id: string; refCode: string }[]
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
}

export interface BulkEditDialogFormValues {
  fieldsArray: FieldItem[]
}

export interface SelectOptionSelectedObject {
  selectOptionEnum: SelectOption
  name: string
  placeholder: string
  options?: Option[]
  inputType: InputType
}

enum SelectOption {
  Status = 'STATUS',
  PolicyType = 'POLICY_TYPE',
  PolicyApprover = 'POLICY_APPROVER',
  PolicyDelegate = 'POLICY_DELEGATE',
  ControlType = 'CONTROL_TYPE',
  ControlOwner = 'CONTROL_OWNER',
}

export enum InputType {
  Select = 'SELECT',
  Input = 'INPUT',
}

export interface FieldItem {
  value: SelectOption | undefined
  selectedObject?: SelectOptionSelectedObject
  selectedValue: string | undefined
}

export const defaultObject = {
  fieldsArray: [],
}

export const getAllSelectOptionsForBulkEditPolicies = (groups: Group[]): SelectOptionSelectedObject[] => {
  return [
    {
      selectOptionEnum: SelectOption.PolicyDelegate,
      name: 'delegateID',
      inputType: InputType.Select,
      placeholder: 'Select deletage',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOption.Status,
      name: 'status',
      inputType: InputType.Select,
      placeholder: 'Select a status',
      options: InternalPolicyStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOption.PolicyType,
      name: 'policyType',
      inputType: InputType.Input,
      placeholder: 'Select a policy type',
    },
    {
      selectOptionEnum: SelectOption.PolicyApprover,
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
      selectOptionEnum: SelectOption.ControlOwner,
      name: 'controlOwnerID',
      placeholder: 'Select control owner',
      inputType: InputType.Select,
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOption.Status,
      name: 'status',
      placeholder: 'Select a status',
      inputType: InputType.Select,
      options: ControlStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOption.ControlType,
      name: 'controlType',
      placeholder: 'Select a control type',
      inputType: InputType.Select,
      options: ControlControlTypeOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
  ]
}
