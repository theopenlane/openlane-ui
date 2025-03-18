import { tv, type VariantProps } from 'tailwind-variants'

const newsletterStyles = tv({
  slots: {
    wrapper: 'relative w-72 mt-14 flex flex-col gap-5 md:flex-row',
    input: 'h-12 md:h-auto text-text-light !border-neutral-300 dark:!border-neutral-300',
    button: 'absolute w-[50%] h-10 text-md md:relative md:text-md md:top-0 md:h-14',
    errorMessage: 'text-text-light mt-14',
    success: 'mt-14 text-center bg-oxford-blue-900 bg-opacity-20 p-5 rounded-md text-white flex gap-3',
    successMessage: 'flex-1',
    successIcon: 'mt-1',
  },
})

export type NewsletterVariants = VariantProps<typeof newsletterStyles>

export { newsletterStyles }
