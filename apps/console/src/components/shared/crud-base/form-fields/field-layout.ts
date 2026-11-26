export type TFieldLayout = 'vertical' | 'horizontal'

export const fieldItemLayoutClassName = (layout: TFieldLayout = 'vertical'): string =>
  layout === 'horizontal' ? 'grid grid-cols-[auto_minmax(0,1fr)] items-center justify-items-end gap-x-4 space-y-0 narrow-rail:rail-row-stacked' : ''

export const fieldMessageLayoutClassName = (layout: TFieldLayout = 'vertical'): string | undefined => (layout === 'horizontal' ? 'col-start-2 text-right narrow-rail:text-left' : undefined)
