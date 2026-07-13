'use client'

import React, { useMemo } from 'react'
import Form from '@rjsf/core'
import type { IChangeEvent } from '@rjsf/core'
import type { ArrayFieldItemTemplateProps, RJSFSchema, TemplatesType, UiSchema } from '@rjsf/utils'
import { customizeValidator } from '@rjsf/validator-ajv8'
import Ajv2020 from 'ajv/dist/2020'
import { ChevronDown, ChevronUp, Copy, Plus, Trash2, X } from 'lucide-react'

interface EmailTemplateConfigFormProps {
  schema: RJSFSchema
  uiSchema?: UiSchema
  formData: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  readOnly?: boolean
}

interface FormIconButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  title?: string
  id?: string
}

const validator = customizeValidator({ AjvClass: Ajv2020 })

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

const configFormClassName = [
  'email-template-config-form',
  'flex flex-col gap-4',
  '[&_fieldset]:flex [&_fieldset]:flex-col [&_fieldset]:gap-4 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0',
  '[&_legend]:text-sm [&_legend]:font-semibold [&_legend]:text-foreground',
  '[&_label]:text-sm [&_label]:font-medium [&_label]:text-foreground',
  '[&_.field-description]:text-xs [&_.field-description]:text-muted-foreground',
  '[&_.form-group]:flex [&_.form-group]:flex-col [&_.form-group]:gap-1.5',
  '[&_input[type=text]]:h-9 [&_input[type=email]]:h-9 [&_input[type=number]]:h-9 [&_input[type=url]]:h-9',
  '[&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:w-full [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:rounded-md [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:border [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:border-input [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:bg-transparent [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:px-3 [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:py-2 [&_input:not([type=checkbox]):not([type=radio]):not([type=color])]:text-sm',
  '[&_input[type=color]]:h-9 [&_input[type=color]]:w-14 [&_input[type=color]]:cursor-pointer [&_input[type=color]]:rounded-md [&_input[type=color]]:border [&_input[type=color]]:border-input [&_input[type=color]]:bg-transparent [&_input[type=color]]:p-1',
  '[&_input[type=checkbox]]:size-4 [&_input[type=checkbox]]:accent-primary',
  '[&_textarea]:w-full [&_textarea]:min-h-24 [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-input [&_textarea]:bg-transparent [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm',
  '[&_select]:h-9 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-input [&_select]:bg-transparent [&_select]:px-3 [&_select]:text-sm',
  '[&_.control-label_.required]:text-destructive [&_.control-label_.required]:ml-0.5',
  '[&_.text-danger]:text-xs [&_.text-danger]:text-destructive [&_.error-detail]:text-xs [&_.error-detail]:text-destructive [&_.error-detail]:list-disc [&_.error-detail]:pl-4',
].join(' ')

export const EmailTemplateConfigForm: React.FC<EmailTemplateConfigFormProps> = ({ schema, uiSchema, formData, onChange, readOnly = false }) => {
  const mergedUiSchema = useMemo<UiSchema>(
    () => ({
      'ui:submitButtonOptions': { norender: true, submitText: '', props: {} },
      ...uiSchema,
    }),
    [uiSchema],
  )

  return (
    <div className={configFormClassName}>
      <Form
        schema={schema}
        uiSchema={mergedUiSchema}
        formData={formData}
        validator={validator}
        templates={{ ButtonTemplates: buttonTemplates, ArrayFieldItemTemplate }}
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
