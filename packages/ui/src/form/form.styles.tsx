import { tv, type VariantProps } from 'tailwind-variants'

export const formStyles = tv({
  slots: {
    formItem: 'space-y-2',
    formLabelError: '',
    formDescription: 'text-sm text-slate-500 dark:text-slate-400',
    formMessageIcon: 'text-util-red-400',
    formMessage:
      'text-util-red-500 rounded  p-[14px] bg-util-red-100 flex items-center gap-4 !mt-5',
  },
})

export type FormVariants = VariantProps<typeof formStyles>
