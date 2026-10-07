import { type UpdateContactInput } from '@repo/codegen/src/schema'
import { orClear, passthrough, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type ContactFormData } from './use-form-schema'

type TContactScalarFields = Pick<ContactFormData, 'fullName' | 'email' | 'company' | 'title' | 'address' | 'phoneNumber' | 'status'>

export const CONTACT_SCALAR_UPDATE_FIELDS = {
  fullName: orClear('clearFullName'),
  email: orClear('clearEmail'),
  company: orClear('clearCompany'),
  title: orClear('clearTitle'),
  address: orClear('clearAddress'),
  phoneNumber: orClear('clearPhoneNumber'),
  status: passthrough,
} satisfies TFieldMappers<TContactScalarFields, UpdateContactInput>
