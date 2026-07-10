import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from 'react-hook-form'

import { cn } from '../../lib/utils'
import { Label } from '../label/label'
import { formStyles } from './form.styles'
import { InfoIcon } from 'lucide-react'

const { formItem, formLabelError, formDescription, formMessage, formMessageIcon } = formStyles()

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

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

const FormItem = ({ className, ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn(formItem(), className)} {...props} />
    </FormItemContext.Provider>
  )
}

const FormLabel = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root>> }) => {
  const { error, formItemId } = useFormField()

  return <Label ref={ref} className={cn(error && formLabelError(), className)} htmlFor={formItemId} {...props} />
}

const FormControl = ({ ref, ...props }: React.ComponentPropsWithoutRef<typeof Slot> & { ref?: React.Ref<React.ElementRef<typeof Slot>> }) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return <Slot ref={ref} id={formItemId} aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`} aria-invalid={!!error} {...props} />
}

const FormDescription = ({ className, ref, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => {
  const { formDescriptionId } = useFormField()

  return <p ref={ref} id={formDescriptionId} className={cn(formDescription(), className)} {...props} />
}

interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  reserveSpace?: boolean
}

const FormMessage = ({ className, children, reserveSpace = false, ref, ...props }: FormMessageProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const { error, formMessageId } = useFormField()

  let body: React.ReactNode = null
  if (error) {
    if (Array.isArray(error)) {
      const uniqueMessages = Array.from(new Set(error.map((err) => err.message)))
      body = uniqueMessages.map((msg, index) => <div key={index}>{msg}</div>)
    } else {
      body = String(error?.message)
    }
  } else {
    body = children || (reserveSpace ? <span style={{ visibility: 'hidden' }}>Placeholder</span> : null)
  }

  return (
    <div ref={ref} id={formMessageId} className={cn(formMessage(), className)} {...props}>
      {error && (
        <span className={formMessageIcon()}>
          <InfoIcon width={16} height={16} />
        </span>
      )}
      {body}
    </div>
  )
}

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }
