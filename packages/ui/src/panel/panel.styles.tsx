import { tv, type VariantProps } from 'tailwind-variants'

export const panelStyles = tv({
  slots: {
    panel:
      'flex flex-col border w-full shadow-3xl rounded-lg bg-panel-bg border-border p-4',
    icon: '',
    iconRow: 'flex gap-6',
    contentColumn: 'flex-1 flex flex-col gap-5',
  },
  variants: {
    gap: {
      0: { panel: 'gap-0' },
      1: { panel: 'gap-1' },
      2: { panel: 'gap-2' },
      4: { panel: 'gap-4' },
      6: { panel: 'gap-6' },
      8: { panel: 'gap-8' },
    },
    align: {
      start: { panel: 'items-start' },
      center: { panel: 'items-center' },
      end: { panel: 'items-end' },
      stretch: { panel: 'items-stretch' },
    },
    justify: {
      start: { panel: 'justify-start' },
      center: { panel: 'justify-center' },
      end: { panel: 'justify-end' },
      between: { panel: 'justify-between' },
      around: { panel: 'justify-around' },
      evenly: { panel: 'justify-evenly' },
    },
    textAlign: {
      left: { panel: 'text-left' },
      right: { panel: 'text-right' },
      center: { panel: 'text-center' },
    },
    destructive: {
      true: {
        panel:
          'bg-red-100 text-red-500 border-none dark:bg-red-100 dark:border-none',
      },
    },
  },
  defaultVariants: {
    gap: 6,
    align: 'stretch',
    justify: 'start',
    textAlign: 'left',
  },
})

export const panelHeaderStyles = tv({
  slots: {
    header: 'mb-4 pb-8',
    heading: 'text-xl font-semibold',
    subheading: 'mt-5 text-md',
  },
  variants: {
    noBorder: {
      true: {
        header: 'border-none pb-0 mb-0',
      },
      false: {
        header: 'border-b border-border',
      },
    },
  },
  defaultVariants: {
    noBorder: false,
  },
})

export type PanelVariants = VariantProps<typeof panelStyles>
export type PanelHeaderVariants = VariantProps<typeof panelHeaderStyles>
