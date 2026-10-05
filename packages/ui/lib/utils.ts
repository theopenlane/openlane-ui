import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({ extend: { theme: { shadow: ['popover'] } } })

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
