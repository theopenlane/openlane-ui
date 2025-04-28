import { HTMLAttributes, ReactNode } from 'react'
import { kbdStyles, type KbdVariants } from './kbd.styles'

export interface KbdProps extends KbdVariants, HTMLAttributes<HTMLDivElement> {
  text: ReactNode | string
  padding?: string
}

export const Kbd = ({ text, size, padding, ...rest }: KbdProps) => {
  const { base } = kbdStyles()

  return (
    <div className={`${base({ size })} ${padding ?? ''}`} {...rest}>
      {text}
    </div>
  )
}

export { kbdStyles }
