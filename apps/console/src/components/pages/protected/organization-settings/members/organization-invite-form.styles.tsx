import { tv, type VariantProps } from 'tailwind-variants'

const organizationInviteStyles = tv({
  slots: {
    buttonRow: 'mt-[26px] flex justify-between',
    roleRow: 'flex items-center gap-2',
  },
})

export type OrganizationInviteVariants = VariantProps<typeof organizationInviteStyles>

export { organizationInviteStyles }
