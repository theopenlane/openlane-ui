import { tv, type VariantProps } from 'tailwind-variants'

const sidebarStyles = tv({
  slots: {
    nav: 'relative h-[calc(100vh-3.5rem)] md:block w-[57px]',
    navInner: 'relative',
    expandNav:
      'absolute bottom-0 bg-background z-50 gap-1 flex items-center justify-center -right-[58px] w-[58px] h-[42px] cursor-pointer rounded-tr-lg border border-border border-b-0 text-3xl',
    expandNavIcon: 'rotate-180',
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
        nav: 'w-60',
        expandNavIcon: 'rotate-0',
      },
    },
  },
})

export type SidebarVariants = VariantProps<typeof sidebarStyles>

export { sidebarStyles }
