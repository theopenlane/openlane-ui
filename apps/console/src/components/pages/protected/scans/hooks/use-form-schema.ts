'use client'
import { z } from 'zod'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'

const formSchema = z.object({
  target: z.string().min(1, 'Target is required'),
  scanType: z.nativeEnum(ScanScanType).optional(),
  status: z.nativeEnum(ScanScanStatus).optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  assignedTo: z.string().optional(),
  performedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
  scanSchedule: z.string().optional(),
})

export const bulkEditFieldSchema = z.object({
  status: z.nativeEnum(ScanScanStatus).optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
})

export type ScanFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<ScanFormData>({
      resolver: zodResolver(formSchema) as Resolver<ScanFormData>,
      defaultValues: {},
    }),
  }
}

export default useFormSchema
