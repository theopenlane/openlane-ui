import { tv } from 'tailwind-variants'

export const standardDetailsStyles = tv({
  slots: {
    card: 'h-fit w-full',
    cardContent: '!p-4',
    tableCell: '!py-2 !px-0 font-medium flex gap-1 items-start',
    valueCell: '!p-2 wrap-anywhere',
    tagsWrapper: 'flex flex-wrap gap-1',
    icon: ' mt-0.5',
  },
})
