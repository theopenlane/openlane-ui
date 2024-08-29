import { tv } from 'tailwind-variants'

export const sliderStyles = tv({
  slots: {
    root: 'relative flex w-full touch-none select-none items-center',
    track:
      'relative h-2 w-full grow overflow-hidden rounded-full bg-blackberry-800 dark:bg-slate-800',
    range: 'absolute h-full bg-slate-900 dark:bg-slate-50',
    thumb:
      'block h-5 w-5 rounded-full border-2 border-slate-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-50 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
  },
})
