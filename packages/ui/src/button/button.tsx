import { Slot } from '@radix-ui/react-slot'
import { forwardRef } from 'react'
import { buttonStyles, type ButtonProps } from './button.styles'
import { CheckIcon, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ asChild = false, className, icon, loading, iconAnimated, iconPosition, variant, full, childFull, children, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'button'
  const { base, iconOuter, iconInner, loadingIcon, childWrapper } = buttonStyles({
    iconAnimated,
    iconPosition,
    variant,
    full,
    childFull,
    ...rest,
  })

  return (
    <Comp className={cn('button-icon', base(), className)} ref={ref} {...rest}>
      <span className={cn(childWrapper(), 'flex items-center gap-2')}>
        {loading && <LoaderCircle className={cn(loadingIcon(), '!relative')} size={20} />}
        {children}
      </span>

      {!loading && icon && (
        <div className={iconOuter()}>
          <div className={iconInner()}>{icon}</div>
        </div>
      )}

      {!loading && variant === 'success' && (
        <div className={iconOuter()}>
          <div className={iconInner()}>
            <CheckIcon />
          </div>
        </div>
      )}
    </Comp>
  )
})

Button.displayName = 'Button'

export { Button, buttonStyles }
