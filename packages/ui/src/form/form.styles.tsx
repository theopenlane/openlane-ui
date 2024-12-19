import { tv, type VariantProps } from 'tailwind-variants'

export const formStyles = tv({
  slots: {
    formItem: 'space-y-2',
    formLabelError: '',
    formDescription: 'text-sm',
    formMessageIcon: 'text-error',
    formMessage:
      'text-sm rounded p-[8px] text-error bg-error-muted bg-opacity-[50%] flex items-center gap-2 !mt-2',
  },
})

export type FormVariants = VariantProps<typeof formStyles>
