import { tv, type VariantProps } from 'tailwind-variants'

const dashboardStyles = tv({
  slots: {
    base: 'flex sticky top-0 h-[calc(100vh-4rem)]',
    main: 'relative flex-1 p-8 pt-4 pb-24 overflow-y-auto',
    footer: 'fixed bottom-0 left-0 right-0 z-2 h-6 text-xs items-center justify-center bg-background-secondary',
  },
  variants: {
    hasBanner: {
      true: {
        base: 'h-[calc(100vh-6rem)]', // extra 2rem for banner
      },
    },
  },
})

export type DashboardVariants = VariantProps<typeof dashboardStyles>

export { dashboardStyles }
