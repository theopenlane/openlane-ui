import { tv } from 'tailwind-variants'

export const sliderStyles = tv({
  slots: {
    root: 'relative flex w-full touch-none select-none items-center',
    track:
      'relative h-2 w-full grow overflow-hidden rounded-full bg-java-800 dark:bg-ziggurat-800',
    range: 'absolute h-full bg-ziggurat-900 dark:bg-ziggurat-50',
    thumb:
      'block h-5 w-5 rounded-full border-2 border-ziggurat-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ziggurat-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-ziggurat-50 dark:bg-glaucous-900 dark:ring-offset-ziggurat-900 dark:focus-visible:ring-ziggurat-300',
  },
})
