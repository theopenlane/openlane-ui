import { tv, type VariantProps } from 'tailwind-variants'

const newsletterStyles = tv({
  slots: {
    wrapper: 'relative mt-14 flex flex-col gap-5 md:flex-row',
    input: 'w-full h-12 md:h-auto text-ziggurat-200',
    button:
      'absolute h-10 text-xs md:relative md:text-sm md:top-0 md:h-14',
    errorMessage: 'text-ziggurat-200 mt-14',
    success:
      'mt-14 text-center bg-ziggurat-900 bg-opacity-20 p-5 rounded-md text-ziggurat-200 flex gap-3',
    successMessage: 'flex-1',
    successIcon: '',
  },
})


export type NewsletterVariants = VariantProps<typeof newsletterStyles>

export { newsletterStyles }
