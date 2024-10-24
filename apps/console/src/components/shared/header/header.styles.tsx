import { tv, type VariantProps } from 'tailwind-variants'

const headerStyles = tv({
  slots: {
    header:
      'bg-ziggurat-100 text-firefly-950 fixed left-0 right-0 top-0 z-20 dark:bg-oxford-blue-900 dark:text-ziggurat-200',
    nav: 'flex h-20 items-center justify-between pl-6 pr-7',
    mobileSidebar: 'block md:!hidden',
    userNav: 'flex items-center gap-9',
  },
})

export type HeaderVariants = VariantProps<typeof headerStyles>

export { headerStyles }
