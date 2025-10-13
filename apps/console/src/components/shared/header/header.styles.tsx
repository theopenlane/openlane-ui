import { tv, type VariantProps } from 'tailwind-variants'

const headerStyles = tv({
  slots: {
    header: 'sticky left-0 right-0 top-0 z-20 shrink-0 my-1',
    nav: 'flex justify-between items-center w-full h-14 py-5 px-6 bg-secondary rounded-xl',
    mobileSidebar: 'block md:hidden',
    userNav: 'flex items-center gap-6',
  },
})

export type HeaderVariants = VariantProps<typeof headerStyles>

export { headerStyles }
