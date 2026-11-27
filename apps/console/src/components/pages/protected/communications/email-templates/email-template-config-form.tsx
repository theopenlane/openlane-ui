'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import Form from '@rjsf/core'
import type { IChangeEvent } from '@rjsf/core'
import { errorId } from '@rjsf/utils'
import type { ArrayFieldItemTemplateProps, ErrorTransformer, FieldErrorProps, ObjectFieldTemplateProps, RegistryWidgetsType, RJSFSchema, TemplatesType, UiSchema, WidgetProps } from '@rjsf/utils'
import { customizeValidator } from '@rjsf/validator-ajv8'
import Ajv2020 from 'ajv/dist/2020'
import { ChevronDown, ChevronUp, Copy, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from '@theopenlane/ui/button'
import { FormMessage } from '@theopenlane/ui/form'
import { toHumanLabel } from '@/utils/strings'
import { isFieldAtDefault, resetFieldsToDefault } from './email-template-defaults'

interface EmailTemplateConfigFormProps {
  schema: RJSFSchema
  uiSchema?: UiSchema
  formData: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  defaultValues?: Record<string, unknown> | null
  readOnly?: boolean
}

type TConfigFormContext = {
  defaultValues?: Record<string, unknown>
  onDataChange?: (data: Record<string, unknown>) => void
}

const COLOR_FORMAT = 'color'

const ColorWidget: React.FC<WidgetProps> = ({ id, value, disabled, readonly, onChange, onBlur, onFocus }) => {
  const color = typeof value === 'string' && value ? value : undefined
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        id={id}
        value={color ?? '#000000'}
        disabled={disabled || readonly}
        className={color ? undefined : 'opacity-40'}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur(id, event.target.value)}
        onFocus={(event) => onFocus(id, event.target.value)}
      />
      <span className="text-sm text-muted-foreground">{color ?? 'Theme default'}</span>
    </div>
  )
}

const configFormWidgets: RegistryWidgetsType = { ColorWidget }

interface FormIconButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  title?: string
  id?: string
}

const TEMPLATE_EXPRESSION = /\{\{[^}]*\}\}/g

const isTemplateAwareUri = (value: string) => URL.canParse(value.replace(TEMPLATE_EXPRESSION, 'x'))

const validator = customizeValidator({ AjvClass: Ajv2020, customFormats: { uri: isTemplateAwareUri } })

const ignoreSystemKeyErrors: ErrorTransformer = (errors) => errors.filter((error) => error.name !== 'additionalProperties')

export const useEmailTemplateSaveBlockedReason = (name: string, schema: RJSFSchema | undefined, formData: Record<string, unknown>): string | undefined => {
  const hasConfigErrors = useMemo(() => !!schema && validator.validateFormData(formData, schema, undefined, ignoreSystemKeyErrors).errors.length > 0, [schema, formData])
  if (!name.trim()) return 'Enter a name for the template'
  if (hasConfigErrors) return 'Fix the highlighted configuration fields'
  return undefined
}

const iconButtonBase = 'inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'
const neutralIconButton = `${iconButtonBase} border-border bg-card text-foreground hover:bg-accent`
const dangerIconButton = `${iconButtonBase} border-border bg-card text-destructive hover:bg-destructive/10`

const AddButton: React.FC<FormIconButtonProps> = ({ onClick, disabled, title, id }) => (
  <div className="mt-2">
    <button type="button" id={id} title={title} onClick={onClick} disabled={disabled} className={neutralIconButton}>
      <Plus size={14} />
      Add
    </button>
  </div>
)

const renderIconButton = ({ onClick, disabled, title, id }: FormIconButtonProps, icon: React.ReactNode, variant: string, fallbackLabel: string) => (
  <button type="button" id={id} title={title ?? fallbackLabel} aria-label={title ?? fallbackLabel} onClick={onClick} disabled={disabled} className={variant}>
    {icon}
  </button>
)

const RemoveButton: React.FC<FormIconButtonProps> = (props) => renderIconButton(props, <Trash2 size={14} />, dangerIconButton, 'Remove')
const MoveUpButton: React.FC<FormIconButtonProps> = (props) => renderIconButton(props, <ChevronUp size={14} />, neutralIconButton, 'Move up')
const MoveDownButton: React.FC<FormIconButtonProps> = (props) => renderIconButton(props, <ChevronDown size={14} />, neutralIconButton, 'Move down')
const CopyButton: React.FC<FormIconButtonProps> = (props) => renderIconButton(props, <Copy size={14} />, neutralIconButton, 'Copy')
const ClearButton: React.FC<FormIconButtonProps> = (props) => renderIconButton(props, <X size={14} />, neutralIconButton, 'Clear')

const buttonTemplates: Partial<TemplatesType['ButtonTemplates']> = { AddButton, RemoveButton, MoveUpButton, MoveDownButton, CopyButton, ClearButton }

const emailBrandingGroups = [
  { title: 'Email Content', fields: ['subject', 'preheader', 'title', 'intros', 'outros'] },
  { title: 'Call to Action', fields: ['buttonText', 'buttonLink', 'buttonColor', 'buttonTextColor'] },
  { title: 'Logos and Identity', fields: ['logoURL', 'headerLogoURL', 'companyName', 'tagline'] },
  { title: 'Colors and Appearance', fields: ['primaryColor', 'textColor', 'bodyBackgroundColor', 'cardBackgroundColor', 'heroBackgroundColor', 'footerTextColor'] },
  { title: 'Social Links', fields: ['social'] },
  { title: 'Footer and Legal', fields: ['companyAddress', 'corporation', 'copyright', 'privacyURL', 'termsURL', 'unsubscribeURL'] },
]

type ObjectProperty = ObjectFieldTemplateProps['properties'][number]
type ConfigSection = { title: string; items: ObjectProperty[] }

const GroupedObjectFieldTemplate: React.FC<ObjectFieldTemplateProps<Record<string, unknown>, RJSFSchema, TConfigFormContext>> = ({ properties, fieldPathId, registry, formData = {}, schema }) => {
  if (fieldPathId.$id !== 'root') {
    return <div className="flex flex-col gap-4">{properties.map((prop) => prop.content)}</div>
  }

  const { defaultValues, onDataChange } = registry.formContext
  const resettableFields = (items: ObjectProperty[]) => {
    if (!defaultValues) return []
    return items
      .map((item) => item.name)
      .filter((field) => {
        const property = schema.properties?.[field]
        return typeof property === 'object' && property.format === COLOR_FORMAT && !isFieldAtDefault(formData, defaultValues, field)
      })
  }
  const resetFields = (fields: string[]) => {
    if (!defaultValues || !onDataChange) return
    onDataChange(resetFieldsToDefault(formData, defaultValues, fields))
  }

  const byName = new Map<string, ObjectProperty>(properties.map((prop) => [prop.name, prop]))
  const used = new Set<string>()
  const sections: ConfigSection[] = []

  for (const group of emailBrandingGroups) {
    const items = group.fields.map((field) => byName.get(field)).filter((prop): prop is ObjectProperty => !!prop)
    items.forEach((item) => used.add(item.name))
    if (items.length > 0) sections.push({ title: group.title, items })
  }

  const ungrouped = properties.filter((prop) => !used.has(prop.name))
  if (ungrouped.length > 0) sections.push({ title: 'Other', items: ungrouped })

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => {
        const changedFields = resettableFields(section.items)
        return (
          <div key={section.title} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              {changedFields.length > 0 && (
                <Button type="button" variant="link" icon={<RotateCcw size={14} />} iconPosition="left" onClick={() => resetFields(changedFields)}>
                  Reset colors
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {section.items.map((item) => (
                <div key={item.name} className="relative">
                  {item.content}
                  {changedFields.includes(item.name) && (
                    <Button
                      type="button"
                      variant="icon"
                      size="icon-xs"
                      className="absolute right-0 top-0"
                      icon={<RotateCcw />}
                      descriptiveTooltipText={`Reset ${toHumanLabel(item.name)} to default`}
                      onClick={() => resetFields([item.name])}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ArrayFieldItemTemplate: React.FC<ArrayFieldItemTemplateProps> = ({ children, buttonsProps, hasToolbar }) => {
  const { hasMoveUp, hasMoveDown, hasCopy, hasRemove, disabled, readonly, onMoveUpItem, onMoveDownItem, onCopyItem, onRemoveItem } = buttonsProps
  const canMove = hasMoveUp || hasMoveDown
  return (
    <div className="relative rounded-md border border-border bg-muted/30 p-4 [&:not(:last-child)]:mb-3">
      {hasToolbar && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
          {canMove && <MoveUpButton onClick={onMoveUpItem} disabled={disabled || readonly || !hasMoveUp} />}
          {canMove && <MoveDownButton onClick={onMoveDownItem} disabled={disabled || readonly || !hasMoveDown} />}
          {hasCopy && <CopyButton onClick={onCopyItem} disabled={disabled || readonly} />}
          {hasRemove && <RemoveButton onClick={onRemoveItem} disabled={disabled || readonly} />}
        </div>
      )}
      {children}
    </div>
  )
}

const FieldErrorTemplate: React.FC<FieldErrorProps> = ({ errors = [], fieldPathId }) => (
  <FormMessage id={errorId(fieldPathId)} error={errors.filter((error): error is string => typeof error === 'string').map((message) => ({ message }))} />
)

const configFormClassName = [
  'email-template-config-form',
  'flex flex-col gap-4',
  '[&_fieldset]:flex [&_fieldset]:flex-col [&_fieldset]:gap-4 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0',
  '[&_legend]:text-sm [&_legend]:font-semibold [&_legend]:text-foreground',
  '[&_label]:text-sm [&_label]:font-medium [&_label]:text-foreground',
  '[&_.field-description]:text-xs [&_.field-description]:text-muted-foreground',
  '[&_.form-group]:flex [&_.form-group]:flex-col [&_.form-group]:gap-1.5',
  '[&_input[type=text]]:h-9 [&_input[type=email]]:h-9 [&_input[type=number]]:h-9 [&_input[type=url]]:h-9',
  '[&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:w-full [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:rounded-md [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:border [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:border-border [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:bg-transparent [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:px-3 [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:py-2 [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:text-sm',
  '[&_input[type=color]]:h-9 [&_input[type=color]]:w-14 [&_input[type=color]]:cursor-pointer [&_input[type=color]]:rounded-md [&_input[type=color]]:border [&_input[type=color]]:border-border [&_input[type=color]]:bg-transparent [&_input[type=color]]:p-1',
  '[&_input[type=checkbox]]:size-4 [&_input[type=checkbox]]:accent-primary',
  '[&_textarea]:w-full [&_textarea]:min-h-24 [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-transparent [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm',
  '[&_select]:h-9 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-transparent [&_select]:px-3 [&_select]:text-sm',
  '[&_.control-label_.required]:text-destructive [&_.control-label_.required]:ml-0.5',
].join(' ')

export const EmailTemplateConfigForm: React.FC<EmailTemplateConfigFormProps> = ({ schema, uiSchema, formData, onChange, defaultValues, readOnly = false }) => {
  const mergedUiSchema = useMemo<UiSchema>(
    () => ({
      'ui:submitButtonOptions': { norender: true, submitText: '', props: {} },
      ...uiSchema,
    }),
    [uiSchema],
  )

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  const onDataChange = useCallback((data: Record<string, unknown>) => onChangeRef.current(data), [])

  const formContext = useMemo<TConfigFormContext>(() => (readOnly || !defaultValues ? {} : { defaultValues, onDataChange }), [defaultValues, onDataChange, readOnly])

  return (
    <div className={configFormClassName}>
      <Form
        schema={schema}
        uiSchema={mergedUiSchema}
        formData={formData}
        validator={validator}
        formContext={formContext}
        widgets={configFormWidgets}
        transformErrors={ignoreSystemKeyErrors}
        templates={{ ButtonTemplates: buttonTemplates, ArrayFieldItemTemplate, FieldErrorTemplate, ObjectFieldTemplate: GroupedObjectFieldTemplate }}
        readonly={readOnly}
        disabled={readOnly}
        liveValidate={!readOnly}
        showErrorList={false}
        noHtml5Validate
        onChange={(e: IChangeEvent) => onChange(e.formData ?? {})}
      />
    </div>
  )
}
