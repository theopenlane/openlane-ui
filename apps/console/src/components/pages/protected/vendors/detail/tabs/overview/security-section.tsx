'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Check, X, PencilIcon } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import type { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'

interface SecuritySectionProps {
  vendor: EntityQuery['entity']
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ vendor, isEditing, canEdit, handleUpdateField }) => {
  const { setValue } = useFormContext()

  const toggleField = async (field: string, currentValue: boolean) => {
    const newValue = !currentValue
    setValue(field, newValue)
    await handleUpdateField({ [field]: newValue })
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
      <div className="space-y-3">
        <SecurityCard
          label="Single Sign-On (SSO)"
          isEditing={isEditing}
          canEdit={canEdit}
          editContent={
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={vendor.ssoEnforced ?? false} onCheckedChange={() => toggleField('ssoEnforced', vendor.ssoEnforced ?? false)} />
              Enforced
            </label>
          }
        >
          <StatusBadge label="Enforced" enabled={vendor.ssoEnforced ?? false} />
        </SecurityCard>
        <SecurityCard
          label="Multi-Factor Authentication (MFA)"
          isEditing={isEditing}
          canEdit={canEdit}
          editContent={
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={vendor.mfaSupported ?? false} onCheckedChange={() => toggleField('mfaSupported', vendor.mfaSupported ?? false)} />
                Supported
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={vendor.mfaEnforced ?? false} onCheckedChange={() => toggleField('mfaEnforced', vendor.mfaEnforced ?? false)} />
                Enforced
              </label>
            </div>
          }
        >
          <StatusBadge label="Supported" enabled={vendor.mfaSupported ?? false} />
          <StatusBadge label="Enforced" enabled={vendor.mfaEnforced ?? false} />
        </SecurityCard>
        <Soc2Card vendor={vendor} isEditing={isEditing} canEdit={canEdit} toggleField={toggleField} />
      </div>
    </div>
  )
}

interface SecurityCardProps {
  label: string
  children: React.ReactNode
  isEditing: boolean
  canEdit: boolean
  editContent: React.ReactNode
}

const SecurityCard: React.FC<SecurityCardProps> = ({ label, children, isEditing, canEdit, editContent }) => {
  const [editing, setEditing] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!editing) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editing])

  return (
    <div ref={ref} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {isEditing || editing ? (
          <>
            {editContent}
            {editing && (
              <button type="button" className="text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer p-0" onClick={() => setEditing(false)}>
                <X size={14} />
              </button>
            )}
          </>
        ) : (
          <>
            {children}
            {canEdit && (
              <button type="button" className="text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer p-0" aria-label={`Edit ${label}`} onClick={() => setEditing(true)}>
                <PencilIcon size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface Soc2CardProps {
  vendor: EntityQuery['entity']
  isEditing: boolean
  canEdit: boolean
  toggleField: (field: string, currentValue: boolean) => Promise<void>
}

const Soc2Card: React.FC<Soc2CardProps> = ({ vendor, isEditing, canEdit, toggleField }) => {
  const [editing, setEditing] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!editing) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editing])

  return (
    <div ref={ref} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium">SOC 2 Compliance</span>
      <div className="flex items-center gap-3">
        {isEditing || editing ? (
          <>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={vendor.hasSoc2 ?? false} onCheckedChange={() => toggleField('hasSoc2', vendor.hasSoc2 ?? false)} />
              Compliant
            </label>
            {editing && (
              <button type="button" className="text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer p-0" onClick={() => setEditing(false)}>
                <X size={14} />
              </button>
            )}
          </>
        ) : (
          <>
            <StatusBadge label="Compliant" enabled={vendor.hasSoc2 ?? false} />

            {canEdit && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer p-0"
                aria-label="Edit SOC 2 Compliance"
                onClick={() => setEditing(true)}
              >
                <PencilIcon size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const StatusBadge: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div className="flex items-center gap-1">
    {enabled ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-destructive" />}
    <span className="text-sm">{label}</span>
  </div>
)

export default SecuritySection
