'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { NumberField } from '@/components/shared/crud-base/form-fields/number-field'
import { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { EnumOptions } from '../../../table/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'
import { MultiStringField } from '@/components/shared/crud-base/form-fields/multi-text-field'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: EntityQuery['entity'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateEntityInput) => Promise<void>
  enumOptions: EnumOptions
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing, handleUpdateField, enumOptions }) => {
  const sharedFieldProps = {
    isEditing,
    isEditAllowed,
    isCreate,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
  }

  return (
    <div className="space-y-6">
      {/* General Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">General Information</CardTitle>
          <CardDescription className="p-0">Basic details of the vendor including the display name and relevant links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="displayName" label="Display Name" tooltipContent="User friendly name of the vendor, this does not need to be unique like the full name" {...sharedFieldProps} />
            <SelectField name="entitySourceTypeName" label="Source Type" options={enumOptions.sourceTypeOptions} {...sharedFieldProps} />
            <MultiStringField
              name="domains"
              label="Domains"
              type="link"
              placeholder="example.com"
              tooltipContent="The domains associated with the vendor, which can be used for identification and risk assessment purposes"
              {...sharedFieldProps}
            />
            <div className="col-span-2 h-1" />
            <TextField
              name="statusPageURL"
              type="link"
              label="Status Page URL"
              tooltipContent="The link to the vendor's status page, which provides real-time information about the vendor's operational status"
              {...sharedFieldProps}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status & Relationship */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Status</CardTitle>
          <CardDescription className="p-0">Status and relationship details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxField name="approvedForUse" label="Approved For Use" tooltipContent="Indicates whether the vendor has been approved for use internally" {...sharedFieldProps} />
            <div className="col-span-2 h-1" />
            <SelectField name="status" label="Status" options={enumOptions.entityStatusOptions} {...sharedFieldProps} />
            <SelectField name="entityRelationshipStateName" label="Relationship State" options={enumOptions.relationshipStateOptions} {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Audit Scope */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Audit Scope</CardTitle>
          <CardDescription className="p-0">Where and how the vendor is used for audit purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField
              name="environmentName"
              label="Environment"
              options={enumOptions.environmentOptions}
              tooltipContent="The environment in which the vendor operates in your organization, e.g. production, development, etc"
              {...sharedFieldProps}
            />
            <SelectField
              name="scopeName"
              label="Scope"
              options={enumOptions.scopeOptions}
              tooltipContent="The audit scope of the vendor, generally indicating the areas and processes covered by the audit"
              {...sharedFieldProps}
            />
          </div>
        </CardContent>
      </Card>

      {/* Review & Ownership */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Review & Ownership</CardTitle>
          <CardDescription className="p-0">Review and ownership details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="internalOwner" label="Internal Owner" tooltipContent="The internal owner responsible for the vendor" {...sharedFieldProps} />
            <SelectField
              name="reviewFrequency"
              label="Review Frequency"
              options={enumOptions.reviewFrequencyOptions}
              tooltipContent="How often the vendor is reviewed e.g. Monthly, Quarterly, Annually"
              {...sharedFieldProps}
            />
            <TextField name="reviewedBy" label="Reviewed By" tooltipContent="The person or group who reviewed the vendor" {...sharedFieldProps} />
            <TextField name="lastReviewedAt" label="Last Reviewed At" type="date" tooltipContent="The date when the vendor was last reviewed" {...sharedFieldProps} />
            <TextField name="nextReviewAt" label="Next Review Due" type="date" tooltipContent="The date when the vendor is next scheduled for review" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Billing & Contract */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Billing and Contract</CardTitle>
          <CardDescription className="p-0">Financial and contract details for the vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxField name="autoRenews" label="Auto Renews" tooltipContent="Indicates if the contract will auto renew at the end of the current term" {...sharedFieldProps} />
            <br />
            <TextField name="billingModel" placeholder="Monthly" label="Billing Model" tooltipContent="The billing model for the vendor, e.g. Monthly, Annual" {...sharedFieldProps} />
            <br />
            <TextField type="currency" name="annualSpend" label="Annual Spend" tooltipContent="The annual spend for the vendor" {...sharedFieldProps} />
            <TextField name="spendCurrency" placeholder="USD" label="Spend Currency" tooltipContent="The currency used for the vendor spend" {...sharedFieldProps} />
            <div className="col-span-2 h-4" />
            <TextField name="contractStartDate" label="Contract Start Date" type="date" tooltipContent="The start date of the vendor contract" {...sharedFieldProps} />
            <TextField name="contractEndDate" label="Contract End Date" type="date" tooltipContent="The end date of the vendor contract" {...sharedFieldProps} />
            <TextField name="contractRenewalAt" label="Contract Renewal At" type="date" tooltipContent="The date when the vendor contract is up for renewal" {...sharedFieldProps} />
            <NumberField name="terminationNoticeDays" placeholder="30" label="Termination Notice Days" tooltipContent="The number of days required for termination notice" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <span className="mb-4 text-sm font-bold">Compliance and Risk:</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                Information related to the vendor&apos;s SOC 2 compliance, which can be a critical factor in assessing the security posture of service providers, especially those that handle sensitive
                data or are integral to business operations
              </div>
              <CheckboxField name="hasSoc2" label="Has SOC 2" tooltipContent="Indicates whether the vendor has SOC 2 compliance." {...sharedFieldProps} />
              <br />
              <TextField name="soc2PeriodEnd" label="SOC 2 Period End" type="date" tooltipContent="The date the last SOC 2 period ended for the vendor" {...sharedFieldProps} />
              <SelectField
                name="entitySecurityQuestionnaireStatusName"
                label="Security Questionnaire Status"
                tooltipContent="The current status of the vendor's security questionnaire"
                options={enumOptions.securityQuestionnaireStatusOptions}
                {...sharedFieldProps}
              />
            </div>
            <div className="flex flex-col gap-2 ml-12">
              <span className="mb-4 text-sm font-bold">Security Features:</span>
              <CheckboxField name="mfaSupported" label="MFA Supported" tooltipContent="Indicates if the vendor has support for multi-factor authorization" {...sharedFieldProps} />
              <CheckboxField name="mfaEnforced" label="MFA Enforced" tooltipContent="Indicates if the vendor enforces multi-factor authorization" {...sharedFieldProps} />
              <CheckboxField name="ssoEnforced" label="SSO Enforced" tooltipContent="Indicates if the vendor has single sign-on and it is enforced" {...sharedFieldProps} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk & Tier */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Risk Review</CardTitle>
          <CardDescription className="p-0">Risk review details including tier, rating, and score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField
              name="tier"
              label="Tier"
              tooltipContent="Categorize this vendor based on business criticality and data sensitivity (e.g., Tier 1 = mission-critical or sensitive data access)"
              {...sharedFieldProps}
            />
            <TextField
              name="riskRating"
              label="Risk Rating"
              tooltipContent="Your qualitative assessment of the vendor’s overall risk (e.g., Low, Moderate, High) based on security, privacy, and operational factors"
              {...sharedFieldProps}
            />
            <NumberField name="riskScore" label="Risk Score" tooltipContent="A numeric score used to quantify vendor risk and support consistent comparison across vendors" {...sharedFieldProps} />
            <TextField name="renewalRisk" label="Renewal Risk" tooltipContent="Likelihood that renewing this vendor presents financial, operational, or compliance risk" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
