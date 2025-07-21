'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlImplementationDocumentStatus } from '@repo/codegen/src/schema'

export const controlImplementationSchema = z.object({
  details: z.any().optional(),
  status: z.nativeEnum(ControlImplementationDocumentStatus).optional(),
  implementationDate: z.date().optional(),
  controlIDs: z.array(z.string()).optional(),
})

export type TFormData = z.infer<typeof controlImplementationSchema> & { id?: string; revision?: string }

const useFormSchema = () => {
  return {
    form: useForm<TFormData>({
      resolver: zodResolver(controlImplementationSchema),
      defaultValues: {
        status: ControlImplementationDocumentStatus.DRAFT,
      },
    }),
  }
}

export default useFormSchema
