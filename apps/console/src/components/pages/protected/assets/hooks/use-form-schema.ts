'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.custom<Value>().optional(),
  tags: z.array(z.string()),
})

export type CreateAssetFormatData = z.infer<typeof formSchema>
export type EditAssetFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateAssetFormatData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        tags: [],
      },
    }),
  }
}

export default useFormSchema
