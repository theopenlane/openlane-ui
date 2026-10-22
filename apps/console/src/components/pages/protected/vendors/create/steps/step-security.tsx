'use client'

import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/cardpanel'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { ShieldCheck, KeyRound, InfoIcon } from 'lucide-react'
import type { EditVendorFormData } from '../../hooks/use-form-schema'
import { ReportFileField } from '@/components/pages/protected/scans/report-scan/upload/report-file-field'
import { type TReportScanFile, useReportScanAvailability } from '@/lib/graphql-hooks/report-scan'
import { SCAN_PERFORMER } from '@/constants/scan-performers'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-category-names'

const createFieldProps = {
  isEditing: true,
  isEditAllowed: true,
  isCreate: true,
  internalEditing: null,
  setInternalEditing: () => {},
}

type StepSecurityProps = {
  soc2Report: TReportScanFile | null
  onSoc2ReportChange: (report: TReportScanFile | null) => void
}

const StepSecurity: React.FC<StepSecurityProps> = ({ soc2Report, onSoc2ReportChange }) => {
  const form = useFormContext<EditVendorFormData>()
  const hasSoc2 = useWatch({ control: form.control, name: 'hasSoc2' })
  const { canStart, isChecking, isPermitted, blockedReason } = useReportScanAvailability(SCAN_PERFORMER.VENDOR_REPORT_REVIEW, !!hasSoc2)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center gap-2 p-0">
            <ShieldCheck size={16} className="text-primary" />
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
          {hasSoc2 && isPermitted && !isChecking ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">{SOC_2_FRAMEWORK_NAME} report (optional)</p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll review it once the vendor is created and save the auditor&apos;s opinion, a risk rating and every exception the auditor found on the vendor.
              </p>
              {!canStart ? (
                <p className="text-sm text-muted-foreground">{blockedReason}</p>
              ) : (
                <ReportFileField value={soc2Report} onChange={onSoc2ReportChange} uploadLabel={`Upload the vendor's ${SOC_2_FRAMEWORK_NAME} report`} />
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center gap-2 p-0">
            <KeyRound size={16} className="text-primary" />
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
