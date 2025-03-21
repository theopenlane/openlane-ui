import { tv } from 'tailwind-variants'

export const standardDetailsStyles = tv({
  slots: {
    card: 'min-w-[366px] size-fit',
    cardContent: '!p-4',
    tableCell: '!py-2 !px-0 font-medium flex gap-1 items-start',
    valueCell: '!p-2',
    tagsWrapper: 'flex flex-wrap gap-1',
    icon: 'text-brand mt-0.5',
  },
})
