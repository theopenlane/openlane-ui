'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/cardpanel'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { ShieldCheck, KeyRound, InfoIcon } from 'lucide-react'
import type { EditVendorFormData } from '../../hooks/use-form-schema'

const createFieldProps = {
  isEditing: true,
  isEditAllowed: true,
  isCreate: true,
  internalEditing: null,
  setInternalEditing: () => {},
}

const StepSecurity: React.FC = () => {
  const form = useFormContext<EditVendorFormData>()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center gap-2 p-0">
            <ShieldCheck size={16} className="text-brand" />
            Compliance and Risk
          </CardTitle>
          <CardDescription className="p-0">
            SOC 2 compliance is a critical factor in assessing the security posture of service providers, especially those that handle sensitive data or are integral to business operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CheckboxField name="hasSoc2" label="Has SOC 2" tooltipContent="Indicates whether the vendor has SOC 2 compliance." {...createFieldProps} />
          <FormField
            control={form.control}
            name="soc2PeriodEnd"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <div className="flex items-center gap-1">
                  <FormLabel>SOC 2 Period End</FormLabel>
                  <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content="The date the last SOC 2 period ended for the vendor" />
                </div>
                <FormControl>
                  <CalendarPopover
                    disableFuture
                    portal
                    field={{
                      value: field.value ? new Date(field.value) : null,
                      onChange: (val: Date | null) => field.onChange(val ? new Date(val).toISOString() : undefined),
                      onBlur: field.onBlur,
                      name: field.name,
                      ref: field.ref,
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center gap-2 p-0">
            <KeyRound size={16} className="text-brand" />
            Security Features
          </CardTitle>
          <CardDescription className="p-0">Single sign-on and multi-factor authentication capabilities the vendor supports or enforces.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CheckboxField name="ssoEnforced" label="SSO Enforced" tooltipContent="Indicates if the vendor has single sign-on and it is enforced" {...createFieldProps} />
          <CheckboxField name="mfaSupported" label="MFA Supported" tooltipContent="Indicates if the vendor has support for multi-factor authorization" {...createFieldProps} />
          <CheckboxField name="mfaEnforced" label="MFA Enforced" tooltipContent="Indicates if the vendor enforces multi-factor authorization" {...createFieldProps} />
        </CardContent>
      </Card>
    </div>
  )
}

export default StepSecurity
