'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, UseFormReturn, useFormContext } from 'react-hook-form'

import { cn } from '../../lib/utils'
import { Label } from '../label/label'
import { formStyles } from './form.styles'
import { FormItemContext, useFormItemLabelId } from './form-item-context'

const { formItem, formLabelRequired, formDescription, formMessage } = formStyles()

const Form = FormProvider

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

const FormField = <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id, hasLabel } = itemContext

  return {
    id,
    name: fieldContext.name,
    hasLabel: !!hasLabel,
    formItemId: `${id}-form-item`,
    formLabelId: `${id}-form-item-label`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

const FormItem = ({ className, ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => {
  const id = React.useId()
  const [hasLabel, setHasLabel] = React.useState(false)
  const value = React.useMemo(() => ({ id, hasLabel, setHasLabel }), [id, hasLabel])

  return (
    <FormItemContext.Provider value={value}>
      <div ref={ref} className={cn(formItem(), className)} {...props} />
    </FormItemContext.Provider>
  )
}

type FormLabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean; ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root>> }

const FormLabel = ({ children, required = false, ref, ...props }: FormLabelProps) => {
  const { formItemId, formLabelId } = useFormField()
  const { setHasLabel } = React.useContext(FormItemContext)

  React.useLayoutEffect(() => {
    setHasLabel?.(true)
    return () => setHasLabel?.(false)
  }, [setHasLabel])

  return (
    <Label ref={ref} {...props} id={formLabelId} htmlFor={formItemId}>
      {children}
      {required && (
        <>
          <span aria-hidden="true" className={formLabelRequired()}>
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      )}
    </Label>
  )
}

const FormControl = ({ ref, ...props }: React.ComponentPropsWithoutRef<typeof Slot> & { ref?: React.Ref<React.ElementRef<typeof Slot>> }) => {
  const { error, hasLabel, formItemId, formLabelId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-labelledby={hasLabel ? formLabelId : undefined}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
}

const FormDescription = ({ className, ref, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => {
  const { formDescriptionId } = useFormField()

  return <p ref={ref} id={formDescriptionId} className={cn(formDescription(), className)} {...props} />
}

type FormMessageError = { message?: string } | { message?: string }[]

interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  reserveSpace?: boolean
  error?: FormMessageError | null
}

const toMessages = (error: FormMessageError | null | undefined): string[] => {
  if (!error) return []
  const messages = (Array.isArray(error) ? error : [error]).map((err) => err?.message).filter((message): message is string => !!message)
  return Array.from(new Set(messages))
}

const useContextFieldError = (): FormMessageError | undefined => {
  const { name } = React.useContext(FormFieldContext)
  const form: UseFormReturn | null = useFormContext()
  if (!name || !form) return undefined
  return form.getFieldState(name, form.formState).error
}

const FormMessage = ({ className, children, reserveSpace = false, error, id, ref, ...props }: FormMessageProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const contextError = useContextFieldError()
  const { id: itemId } = React.useContext(FormItemContext)
  const messages = toMessages(error ?? contextError)

  let body: React.ReactNode
  if (messages.length > 1) {
    body = messages.map((message) => <div key={message}>{message}</div>)
  } else if (messages.length === 1) {
    body = messages[0]
  } else {
    body = children || (reserveSpace ? <span style={{ visibility: 'hidden' }}>Placeholder</span> : null)
  }

  if (!body) return null

  return (
    <div ref={ref} id={id ?? (itemId ? `${itemId}-form-item-message` : undefined)} className={cn(formMessage(), className)} {...props}>
      {body}
    </div>
  )
}

export { useFormField, useFormItemLabelId, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }
