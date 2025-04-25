import { tv, type VariantProps } from 'tailwind-variants'

const newsletterStyles = tv({
  slots: {
    wrapper: 'relative w-72 flex flex-col gap-3 ',
    button: ' p-4 text-button-text bg-brand justify-between items-center rounded-md text-sm h-10 font-bold flex',
    errorMessage: 'text-text-light mt-14',
    success: 'mt-14 text-center bg-oxford-blue-900 bg-opacity-20 p-5 rounded-md text-white flex gap-3',
    successMessage: 'flex-1',
    successIcon: 'mt-1',
  },
})

export type NewsletterVariants = VariantProps<typeof newsletterStyles>

export { newsletterStyles }
