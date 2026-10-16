import { useForm } from 'react-hook-form'
import { type z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { subprocessorListingSchema } from '@/components/pages/protected/trust-center/shared/subprocessor-listing-schema'

export type TAddToTrustCenterFormData = z.infer<typeof subprocessorListingSchema>

export const useAddToTrustCenterForm = () => useForm<TAddToTrustCenterFormData>({ resolver: zodResolver(subprocessorListingSchema), defaultValues: { countries: [], category: '' } })
