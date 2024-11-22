import { tv, type VariantProps } from 'tailwind-variants'

const organizationSelectorStyles = tv({
  slots: {
    logoWrapper: 'hidden items-center justify-between gap-2 md:flex',
    container: 'flex content-center gap-4',
    organizationLabel:
      'uppercase font-sans text-sm font-semibold tracking-wide',
    organizationDropdown: 'flex items-center gap-[6px] text-lg cursor-pointer',
    dropdownContent: 'p-0',
    allOrganizationsLink:
      'flex items-center gap-2 py-5 px-6 border-t border-oxford-blue-200',
    popoverContent: 'p-0 w-[400px] dark:bg-glaucous-900',
    searchWrapper: 'py-5 px-6',
    orgWrapper:
      'transition-all duration-500 flex gap-3 items-center py-4 px-6 border-t border-oxford-blue-200 hover:bg-firefly-700 cursor-pointer relative',
    orgInfo: 'flex flex-col gap-1 items-start flex-1',
    orgTitle: 'text-sm',
    orgSelect:
      'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
  },
})

export type OrganizationSelectorVariants = VariantProps<
  typeof organizationSelectorStyles
>

export { organizationSelectorStyles }
