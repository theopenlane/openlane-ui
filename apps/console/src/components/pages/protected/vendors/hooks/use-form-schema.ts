'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  displayName: z.string().optional(),
  description: z.custom<Value | string>().optional(),
  domains: z.array(z.string()).optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  contacts: z.array(z.string()).optional(),
  entityTypeID: z.string().optional(),
  note: z.custom<Value | string>().optional(),
})

export type CreateVendorFormData = z.infer<typeof formSchema>
export type EditVendorFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateVendorFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {},
    }),
  }
}

export default useFormSchema
