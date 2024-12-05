import { tv, type VariantProps } from 'tailwind-variants'

const sidebarStyles = tv({
  slots: {
    nav: 'relative hidden h-screen border-oxford-blue-200 bg-ziggurat-100 text-firefly-950 border-oxford-blue-200 md:block w-[57px] dark:bg-glaucous-950 dark:border-oxford-blue-200 dark:text-ziggurat-200',
    navInner: 'relative',
    expandNav:
      'absolute gap-1 flex items-center justify-center bg-ziggurat-100 -right-[58px] w-[58px] h-[42px] bottom-0 cursor-pointer rounded-tr-lg border border-oxford-blue-200 border-b-0 text-3xl text-java-400 dark:bg-glaucous-950 dark:border-oxford-blue-200',
    expandNavIcon: 'rotate-180',
    sideNav:
      'text-black bg-white dark:text-neutral-50 dark:bg-glaucous-900 text-sm left-8 opacity-0 transition-all duration-300 group-hover:z-50 group-hover:ml-4 group-hover:rounded group-hover:bg-foreground group-hover:p-2 group-hover:opacity-100 group-hover:shadow-sm group-hover:border group-hover:dark:border-oxford-blue-700 group-hover:border-oxford-blue-200',
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
