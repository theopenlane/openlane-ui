import { tv, type VariantProps } from 'tailwind-variants'

const sidebarNavStyles = tv({
  slots: {
    nav: 'space-y-[1px] overflow-x-visible min-h-[calc(100vh-4rem)] h-auto pt-4 pb-10 tracking-tighter bg-background-secondary',
    icon: 'h-5 w-5 text-mauve-400',
    linkLabel: 'text-base absolute left-12 nowrap duration-200',
    accordionTrigger: 'group relative flex h-[2.2rem] justify-between px-4 py-2 duration-200 hover:bg-muted hover:rounded hover:no-underline',
    link: 'font-sans px-4 py-1 group relative flex h-[2.2rem] justify-start items-center hover:bg-muted hover:rounded hover:no-underline',
    accordionItem: 'border-none',
    separator: '!my-4',
    heading: 'font-sans px-4 py-2 uppercase font-bold tracking-[0.42px]',
    badgeCount: 'flex relative ml-36 px-2 pt-px justify-center bg-accent text-[14px] font-semibold rounded-[6px] w-[22px] h-[22px] text-text-dark',
  },
  variants: {
    isCurrent: {
      true: {
        accordionTrigger: 'bg-muted',
        icon: 'text-mauve-400 dark:text-mauve-100',
        link: 'rounded-md bg-muted hover:bg-muted',
        badgeCount: 'flex relative ml-40 pt-px justify-center bg-accent text-[14px] rounded-[6px] w-[22px] h-[22px]',
      },
    },
  },
})

export type SidebarNavigationVariants = VariantProps<typeof sidebarNavStyles>

export { sidebarNavStyles }
