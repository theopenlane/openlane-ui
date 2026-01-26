import { tv, type VariantProps } from 'tailwind-variants'

const tabsStyles = tv({
  slots: {
    tabsList: 'flex',
    tabsTrigger: '',
    tabsContent: 'mt-2 bg-unset text-sm ',
  },
  variants: {
    variant: {
      underline: {
        tabsList: 'rounded-lg p-1 h-9 items-center justify-center',
        tabsTrigger: [
          'flex-1 rounded-t-xl items-center justify-center whitespace-nowrap px-3 py-2 font-sans  ',
          'transition-all bg-unset disabled:pointer-events-none disabled:opacity-50',
          'shadow-[inset_0_-1px_0_0_var(--color-border)] data-[state=active]:border-b data-[state=active]:border-primary',
        ].join(' '),
      },
      solid: {
        tabsList: 'w-full rounded-md bg-background p-0.5 flex justify-between',
        tabsTrigger: 'flex-1 h-7 px-2 rounded-[5px] border border-transparent data-[state=active]:bg-btn-secondary data-[state=active]:text-btn-secondary-text !text-sm text-center',
        tabsContent: 'mt-[26px]',
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
  },
})

export type TabsVariants = VariantProps<typeof tabsStyles>

export { tabsStyles }
