import { tv, type VariantProps } from 'tailwind-variants'

const organizationSelectorStyles = tv({
  slots: {
    logoWrapper: 'hidden items-center justify-between gap-2 md:flex',
    container: 'flex content-center gap-4 ',
    organizationDropdown: 'flex items-center gap-[6px] text-md cursor-pointer w-[156px] border rounded-md px-2 py-0.5 ',
    dropdownContent: 'p-0',
    allOrganizationsLink: 'flex items-center gap-2  pb-3 px-4 ',
    popoverContent: 'p-0 max-w-300',
    searchWrapper: 'px-5 pt-3 pb-2.5',
    orgWrapper: ' flex gap-3 items-center py-1 px-4  cursor-pointer relative',
    orgInfo: 'flex col gap-1 items-center flex-1',
    orgTitle: 'text-xs truncate max-w-44',
    orgSelect: 'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
  },
})

export type OrganizationSelectorVariants = VariantProps<typeof organizationSelectorStyles>

export { organizationSelectorStyles }
