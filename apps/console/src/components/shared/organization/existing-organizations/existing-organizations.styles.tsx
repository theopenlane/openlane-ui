import { tv, type VariantProps } from 'tailwind-variants'

const existingOrganizationsStyles = tv({
  slots: {
    container: 'flex content-center gap-4 w-full max-w-[575px] mx-auto mb-6',
    orgWrapper:
      'transition-all duration-500 flex gap-3 items-center pb-4 cursor-pointer relative',
    orgInfo: 'flex flex-col gap-1 items-start flex-1',
    orgTitle: 'font-sans text-oxford-blue-800',
    orgSelect: 'transition-opacity duration-300',
  },
})

export type ExistingOrganizationsVariants = VariantProps<
  typeof existingOrganizationsStyles
>

export { existingOrganizationsStyles }
