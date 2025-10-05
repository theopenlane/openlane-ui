'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Lightbulb } from 'lucide-react'
import { Input } from '@repo/ui/input'

const AdvancedSetupStep3 = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Auditors</h2>
        <p className="text-sm text-muted-foreground">
          Provide information about your audit partner or firm. This ensures the right people are connected and ready when your program moves into review.
        </p>
      </div>

      {/* Tips card */}
      <div className="p-4 rounded-md border border-tip-border bg-tip-background">
        <div className="flex gap-2 items-start mb-3">
          <Lightbulb className="text-tip-text" size={18} />
          <span className="text-sm text-tip-text">Tips</span>
        </div>
        <p className="text-sm text-tip-text">
          A well-structured compliance program has the potential to completely transform your organization, enhancing its operational efficiency and fostering a culture of integrity and
          accountability.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Audit Partner */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Audit Partner</label>
          <Input placeholder="Luke Dalton" {...register('auditPartner', { required: 'Audit Partner is required' })} />
          {errors.auditPartner && <span className="text-xs text-destructive">{String(errors.auditPartner.message)}</span>}
        </div>

        {/* Audit Firm */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Audit Firm</label>
          <Input placeholder="Exalt Studio" {...register('auditFirm', { required: 'Audit Firm is required' })} />
          {errors.auditFirm && <span className="text-xs text-destructive">{String(errors.auditFirm.message)}</span>}
        </div>

        {/* Audit Partner Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Audit Partner Email</label>
          <Input
            placeholder="Enter a contact email for the audit partner"
            type="email"
            {...register('auditPartnerEmail', {
              required: 'Audit Partner Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
          />
          {errors.auditPartnerEmail && <span className="text-xs text-destructive">{String(errors.auditPartnerEmail.message)}</span>}
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep3
