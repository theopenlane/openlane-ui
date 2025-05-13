import { tv, type VariantProps } from 'tailwind-variants'

const headerStyles = tv({
  slots: {
    header: 'sticky left-0 right-0 top-0 z-20 py-4 h-16 border-b border-border bg-background-secondary',
    nav: 'flex h-[30px] items-center justify-between px-4',
    mobileSidebar: 'block md:!hidden',
    userNav: 'flex items-center gap-9 py-4',
  },
})

export type HeaderVariants = VariantProps<typeof headerStyles>

export { headerStyles }
