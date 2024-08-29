import { tv, type VariantProps } from 'tailwind-variants'

const tabsStyles = tv({
  slots: {
    tabsList: 'flex',
    tabsTrigger: '',
    tabsContent:
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  },
  variants: {
    variant: {
      underline: {
        tabsList:
          'rounded-lg bg-muted p-1 text-blackberry-900 h-9 items-center justify-center',
        tabsTrigger:
          'flex-1 items-center justify-center whitespace-nowrap px-3 py-2 font-sans border-b border-winter-sky-900 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-sunglow-900 data-[state=active]:border-b-2 data-[state=active]:text-sunglow-900',
      },
      solid: {
        tabsList: 'rounded-md bg-winter-sky-800 p-[10px] items-start',
        tabsTrigger:
          'py-[15px] px-5 rounded-[5px] border border-transparent data-[state=active]:border-winter-sky-900 data-[state=active]:bg-white',
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
