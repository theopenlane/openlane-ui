import { tv } from 'tailwind-variants'

export const sliderStyles = tv({
  slots: {
    root: 'relative flex w-full rounded-md touch-none select-none items-center h-6 bg-accent-secondary',
    track:
      'relative h-2 w-full grow overflow-hidden rounded-full',
    range: 'absolute h-full',
    thumb:
      'block h-5 w-5 rounded-full border-2 border-oxford-blue-900 = ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxford-blue-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-oxford-blue-50',
  },
})
