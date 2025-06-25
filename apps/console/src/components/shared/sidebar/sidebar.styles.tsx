import { tv, type VariantProps } from 'tailwind-variants'

const sidebarStyles = tv({
  slots: {
    nav: 'relative h-full md:block w-[57px] transition-all no-scrollbar',
    navInner: 'relative',
    expandNav: 'relative flex gap-3.5 items-center',
    sideNav:
      'text-sm left-8 opacity-0 transition-all duration-300 group-hover:z-50 group-hover:ml-4 group-hover:p-3 group-hover:opacity-100 group-hover:shadow-sm group-hover:border group-hover:border-border group-hover:rounded-xl group-hover:bg-background-secondary',
  },
  variants: {
    status: {
      true: {
        nav: 'duration-500',
      },
    },
    isOpen: {
      true: {
        nav: 'w-60 overflow-auto max-h-[calc(100%_-_41px)] z-20',
      },
    },
  },
})

export type SidebarVariants = VariantProps<typeof sidebarStyles>

export { sidebarStyles }
