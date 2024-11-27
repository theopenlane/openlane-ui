import { tv, type VariantProps } from 'tailwind-variants'

const sidebarAccordionStyles = tv({
  slots: {
    accordionItem: 'border-b',
    accordionHeader:
      'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
    accordionContent:
      'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
    accordionContentInner: 'pb-2 pt-0',
    accordionTriggerHeader: 'flex',
  },
})

export type SidebarAccordionVariants = VariantProps<
  typeof sidebarAccordionStyles
>

export { sidebarAccordionStyles }
