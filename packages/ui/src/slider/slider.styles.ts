import { tv } from 'tailwind-variants'

export const sliderStyles = tv({
  slots: {
    root: 'relative flex w-full touch-none select-none items-center',
    track:
      'relative h-2 w-full grow overflow-hidden rounded-full bg-teal800 dark:bg-oxford-blue-800',
    range: 'absolute h-full bg-oxford-blue-900 dark:bg-oxford-blue-50',
    thumb:
      'block h-5 w-5 rounded-full border-2 border-oxford-blue-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxford-blue-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-oxford-blue-50 dark:bg-glaucous-900 dark:ring-offset-oxford-blue-900 dark:focus-visible:ring-oxford-blue-300',
  },
})
