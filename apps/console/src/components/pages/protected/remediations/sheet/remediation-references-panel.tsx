'use client'

import React, { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { ChevronDown, FolderGit2, GitPullRequest, Globe, type LucideIcon, Ticket, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { FormControl, FormField, FormItem, FormMessage } from '@repo/ui/form'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { type RemediationQuery } from '@repo/codegen/src/schema'
import { ExternalLinkValue } from '@/components/shared/external-link/external-link-value'
import { isNavigableUrl } from '@/utils/normalizeUrl'
import { type RemediationFormData } from '../hooks/use-form-schema'
import { CollapsiblePanel } from './collapsible-panel'

type TReferenceField = 'repositoryURI' | 'pullRequestURI' | 'ticketReference' | 'externalURI'

const REFERENCE_TYPES: { field: TReferenceField; label: string; icon: LucideIcon; placeholder: string }[] = [
  { field: 'repositoryURI', label: 'Repository', icon: FolderGit2, placeholder: 'https://github.com/org/repo' },
  { field: 'pullRequestURI', label: 'Pull Request', icon: GitPullRequest, placeholder: 'https://github.com/org/repo/pull/123' },
  { field: 'ticketReference', label: 'Ticket', icon: Ticket, placeholder: 'https://acme.atlassian.net/browse/SEC-123 or SEC-123' },
  { field: 'externalURI', label: 'External Link', icon: Globe, placeholder: 'https://example.com' },
]

const REFERENCE_FIELDS = REFERENCE_TYPES.map(({ field }) => field)

const ReferenceValue: React.FC<{ value: string }> = ({ value }) =>
  isNavigableUrl(value) ? <ExternalLinkValue value={value} className="min-w-0 break-all" /> : <span className="break-all">{value}</span>

const ReferenceRow: React.FC<{ icon: LucideIcon; label: string; children: React.ReactNode; action?: React.ReactNode }> = ({ icon: Icon, label, children, action }) => (
  <div className="grid grid-cols-[auto_minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
    <Icon size={16} className="text-muted-foreground" />
    <span className="text-sm font-medium">{label}</span>
    <div className="min-w-0 text-sm">{children}</div>
    {action ?? <span />}
  </div>
)

type TRemediationReferencesPanelProps = {
  form: UseFormReturn<RemediationFormData>
  isEditing: boolean
  remediation?: RemediationQuery['remediation']
}

const RemediationReferencesEdit: React.FC<{ form: UseFormReturn<RemediationFormData> }> = ({ form }) => {
  const [shownFields, setShownFields] = useState<TReferenceField[]>(() => REFERENCE_FIELDS.filter((field) => !!form.getValues(field)?.trim()))
  const [addedField, setAddedField] = useState<TReferenceField | null>(null)
  const [isOpen, setIsOpen] = useState(shownFields.length > 0)
  const visibleTypes = REFERENCE_TYPES.filter(({ field }) => shownFields.includes(field))
  const availableTypes = REFERENCE_TYPES.filter(({ field }) => !shownFields.includes(field))

  const addReference = (field: TReferenceField) => {
    setShownFields((current) => [...current, field])
    setAddedField(field)
    setIsOpen(true)
  }

  const removeReference = (field: TReferenceField) => {
    setShownFields((current) => current.filter((shown) => shown !== field))
    if (form.formState.defaultValues?.[field]) {
      form.setValue(field, '', { shouldDirty: true, shouldValidate: true })
    } else {
      form.resetField(field)
    }
  }

  return (
    <CollapsiblePanel
      title="References"
      open={isOpen}
      onOpenChange={setIsOpen}
      action={
        availableTypes.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary">
                Add reference
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableTypes.map(({ field, label, icon: Icon }) => (
                <DropdownMenuItem key={field} onSelect={() => addReference(field)}>
                  <Icon size={14} />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    >
      {visibleTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Link a repository, pull request, ticket or any external page related to this remediation.</p>
      ) : (
        <div className="rounded-md border border-border">
          {visibleTypes.map(({ field, label, icon, placeholder }) => (
            <ReferenceRow
              key={field}
              icon={icon}
              label={label}
              action={<Button type="button" variant="icon" size="icon-sm" icon={<X size={14} />} descriptiveTooltipText={`Remove ${label.toLowerCase()}`} onClick={() => removeReference(field)} />}
            >
              <FormField
                control={form.control}
                name={field}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...inputField} value={inputField.value ?? ''} aria-label={label} placeholder={placeholder} autoFocus={addedField === field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ReferenceRow>
          ))}
        </div>
      )}
    </CollapsiblePanel>
  )
}

const RemediationReferencesView: React.FC<{ remediation: RemediationQuery['remediation'] }> = ({ remediation }) => {
  const references = REFERENCE_TYPES.filter(({ field }) => !!remediation[field]?.trim())

  if (references.length === 0) {
    return null
  }

  return (
    <CollapsiblePanel title="References">
      <div className="rounded-md border border-border">
        {references.map(({ field, label, icon }) => (
          <ReferenceRow key={field} icon={icon} label={label}>
            <ReferenceValue value={remediation[field] ?? ''} />
          </ReferenceRow>
        ))}
      </div>
    </CollapsiblePanel>
  )
}

const RemediationReferencesPanel: React.FC<TRemediationReferencesPanelProps> = ({ form, isEditing, remediation }) =>
  isEditing || !remediation ? <RemediationReferencesEdit form={form} /> : <RemediationReferencesView remediation={remediation} />

export default RemediationReferencesPanel
