import { tv, type VariantProps } from 'tailwind-variants'

const dashboardStyles = tv({
  slots: {
    base: 'flex flex-1 overflow-hidden',
    main: 'relative flex-1 p-8 pt-4 overflow-y-auto mb-2 bg-secondary rounded-xl ',
    footer: 'fixed bottom-0 left-0 right-0 z-2 h-6 text-xs items-center justify-center bg-background-secondary',
  },
  variants: {
    hasBanner: {
      true: {
        base: 'flex-1',
      },
    },
  },
})

export type DashboardVariants = VariantProps<typeof dashboardStyles>

export { dashboardStyles }
