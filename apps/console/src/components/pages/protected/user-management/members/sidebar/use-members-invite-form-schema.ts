'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InviteRole } from '@repo/codegen/src/schema'
import { isValidEmail } from '@/lib/validators'

const formSchema = z.object({
  emails: z.array(z.string().refine(isValidEmail, { message: 'Invalid email address' })).min(1, 'Add at least one email'),
  role: z.nativeEnum(InviteRole, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
})

export type MembersInviteFormData = z.infer<typeof formSchema>

const useMembersInviteFormSchema = () => {
  return {
    form: useForm<MembersInviteFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        emails: [],
        role: InviteRole.MEMBER,
      },
    }),
  }
}

export default useMembersInviteFormSchema
