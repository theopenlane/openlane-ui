import { tv, type VariantProps } from 'tailwind-variants'

const dashboardStyles = tv({
  slots: {
    base: 'flex h-screen border-collapse',
    main: 'flex-1 overflow-y-auto p-10 pt-[100px] pb-24 bg-secondary/100',
  },
})

export type DashboardVariants = VariantProps<typeof dashboardStyles>

export { dashboardStyles }
