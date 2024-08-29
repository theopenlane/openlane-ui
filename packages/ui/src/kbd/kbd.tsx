import { HTMLAttributes, ReactNode } from 'react'
import { kbdStyles, type KbdVariants } from './kbd.styles'

export interface KbdProps extends KbdVariants, HTMLAttributes<HTMLDivElement> {
  text: ReactNode | string
}

export const Kbd = ({ text, size, ...rest }: KbdProps) => {
  const { base } = kbdStyles()

  return (
    <div className={base({ size })} {...rest}>
      {text}
    </div>
  )
}

export { kbdStyles }
