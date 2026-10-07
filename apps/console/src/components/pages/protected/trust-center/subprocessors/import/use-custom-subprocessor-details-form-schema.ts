'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resolveLogo } from './subprocessor-import-rows'

const formSchema = z
  .object({
    website: z.string().trim(),
    logoRemoteURL: z.string().trim(),
    description: z.string().trim(),
    tags: z.array(z.string()),
  })
  .refine((values) => resolveLogo(values).state !== 'invalid', { message: 'Enter an https image URL without a port', path: ['logoRemoteURL'] })

export type TCustomSubprocessorDetailsFormData = z.infer<typeof formSchema>

const EMPTY_DETAILS: TCustomSubprocessorDetailsFormData = { website: '', logoRemoteURL: '', description: '', tags: [] }

export const useCustomSubprocessorDetailsFormSchema = () => ({
  form: useForm<TCustomSubprocessorDetailsFormData>({ resolver: zodResolver(formSchema), defaultValues: EMPTY_DETAILS }),
})
