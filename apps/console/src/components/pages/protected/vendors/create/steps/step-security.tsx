'use client'

import React from 'react'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'

const createFieldProps = {
  isEditing: true,
  isEditAllowed: true,
  isCreate: true,
  internalEditing: null,
  setInternalEditing: () => {},
}

const StepSecurity: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-2">
        <span className="mb-2 text-sm font-bold">Compliance and Risk</span>
        <p className="text-sm text-muted-foreground mb-2">
          Information related to the vendor&apos;s SOC 2 compliance, which can be a critical factor in assessing the security posture of service providers, especially those that handle sensitive data
          or are integral to business operations.
        </p>
        <CheckboxField name="hasSoc2" label="Has SOC 2" tooltipContent="Indicates whether the vendor has SOC 2 compliance." {...createFieldProps} />
        <TextField name="soc2PeriodEnd" label="SOC 2 Period End" type="date" tooltipContent="The date the last SOC 2 period ended for the vendor" {...createFieldProps} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="mb-2 text-sm font-bold">Security Features</span>
        <p className="text-sm text-muted-foreground mb-2">Single sign-on and multi-factor authentication capabilities the vendor supports or enforces.</p>
        <CheckboxField name="ssoEnforced" label="SSO Enforced" tooltipContent="Indicates if the vendor has single sign-on and it is enforced" {...createFieldProps} />
        <CheckboxField name="mfaSupported" label="MFA Supported" tooltipContent="Indicates if the vendor has support for multi-factor authorization" {...createFieldProps} />
        <CheckboxField name="mfaEnforced" label="MFA Enforced" tooltipContent="Indicates if the vendor enforces multi-factor authorization" {...createFieldProps} />
      </div>
    </div>
  )
}

export default StepSecurity
