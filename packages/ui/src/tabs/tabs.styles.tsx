import { tv, type VariantProps } from 'tailwind-variants'

const tabsStyles = tv({
  slots: {
    tabsList: 'flex',
    tabsTrigger: '',
    tabsContent:
      'mt-2 ring-offset-background text-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  },
  variants: {
    variant: {
      underline: {
        tabsList:
          'rounded-lg p-1 h-9 items-center justify-center',
        tabsTrigger:
          'flex-1 rounded-t-xl items-center justify-center whitespace-nowrap px-3 py-2 font-sans text-text-dark border-b border-border-dark ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-teal-400 data-[state=active]:!bg-opacity-20 data-[state=active]:border-b-2',
      },
      solid: {
        tabsList: 'rounded-md bg-panel p-[10px] items-start',
        tabsTrigger:
          'py-[10px] px-5 rounded-[5px] border border-transparent data-[state=active]:bg-button data-[state=active]:text-button-text',
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
