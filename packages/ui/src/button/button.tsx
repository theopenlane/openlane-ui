import { Slot } from '@radix-ui/react-slot'
import { forwardRef } from 'react'
import { buttonStyles, type ButtonProps } from './button.styles'
import { CheckIcon, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      icon,
      loading,
      iconAnimated,
      iconPosition,
      variant,
      full,
      childFull,
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const {
      base,
      iconOuter,
      iconInner,
      loadingIcon,
      loadingWrapper,
      loadingText,
      childWrapper,
    } = buttonStyles({
      iconAnimated,
      iconPosition,
      variant,
      full,
      childFull,
      ...rest,
    })

    return (
      <Comp
        className={`button-icon ${base()}${className ? ` ${className}` : ''}`}
        ref={ref}
        {...rest}
      >
        <span className={cn(childWrapper(), loading && loadingText())}>
          {rest.children}
        </span>
        {icon ? (
          <div className={iconOuter()}>
            <div className={iconInner()}>
              {icon}
              {icon}
            </div>
          </div>
        ) : null}
        {variant === 'success' ? (
          <div className={iconOuter()}>
            <div className={iconInner()}>
              <CheckIcon />
            </div>
          </div>
        ) : null}
        {loading && (
          <div className={loadingWrapper()}>
            <LoaderCircle className={loadingIcon()} size={20} />
          </div>
        )}
      </Comp>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonStyles }
