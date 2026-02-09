'use client'

import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { inputRowStyles, InputRowVariants, inputStyles, type InputVariants } from './input.styles'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'>, InputVariants {
  icon?: ReactNode
  prefix?: ReactNode
  onIconClick?: () => void
  maxWidth?: boolean
  iconPosition?: 'right' | 'left'
  variant?: 'medium' | 'light' | 'searchTable'
  suffix?: string
}

interface InputRowProps extends InputRowVariants {
  className?: string
  children: ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, icon, prefix, suffix, variant, onIconClick, maxWidth, iconPosition = 'right', ...props }, ref) => {
  const { input, inputWrapper, iconWrapper, prefixWrapper } = inputStyles({
    variant,
  })
  const hasIcon = Boolean(icon)
  const hasPrefix = Boolean(prefix)
  const prefixRef = useRef<HTMLDivElement>(null)
  const [prefixWidth, setPrefixWidth] = useState(0)
  const [isFocused, setIsFocused] = useState<boolean>(false)

  useEffect(() => {
    if (prefixRef.current) {
      setPrefixWidth(prefixRef.current.offsetWidth)
    }
  }, [prefix])

  return (
    <div className={`${inputWrapper({ hasIcon, hasPrefix })} ${maxWidth ? 'w-full' : ''}`}>
      {prefix && (
        <div ref={prefixRef} className={prefixWrapper()}>
          {prefix}
        </div>
      )}
      <input
        type={type}
        ref={ref}
        {...props}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        className={cn(input({ hasIcon, hasPrefix, iconPosition }), className, isFocused && 'border-brand!')}
        style={{ paddingLeft: hasPrefix ? prefixWidth + 12 : undefined }}
      />
      {icon && (
        <div className={iconWrapper({ iconPosition })} onClick={onIconClick} style={{ cursor: onIconClick ? 'pointer' : 'filled' }}>
          {icon}
        </div>
      )}
      {suffix && <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm bg-background-secondary border rounded-md px-1.5 py-0.5 font-medium">{suffix}</div>}
    </div>
  )
})
Input.displayName = 'Input'

const InputRow: React.FC<InputRowProps> = ({ children, className }) => {
  const styles = inputRowStyles()
  return <div className={cn(styles.wrapper(), className)}>{children}</div>
}

export { Input, InputRow }
