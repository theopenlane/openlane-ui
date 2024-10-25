import { tv, type VariantProps } from 'tailwind-variants'

const createOrganizationStyles = tv({
  slots: {
    container: 'flex content-center gap-4 w-full max-w-[575px] mx-auto',
  },
})

export type CreateOrganizationVariants = VariantProps<typeof createOrganizationStyles>

export { createOrganizationStyles }
