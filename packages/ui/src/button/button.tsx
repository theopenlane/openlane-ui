import { Slot } from '@radix-ui/react-slot'
import { buttonStyles, type ButtonProps } from './button.styles'
import { CheckIcon, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'

const Button = ({
  asChild = false,
  className,
  icon,
  loading,
  iconAnimated,
  iconPosition,
  variant,
  full,
  childFull,
  children,
  descriptiveTooltipText,
  'aria-label': ariaLabelProp,
  ref,
  ...rest
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const Comp = asChild ? Slot : 'button'
  const { base, iconOuter, iconInner, loadingIcon, childWrapper } = buttonStyles({
    iconAnimated,
    iconPosition,
    variant,
    full,
    childFull,
    ...rest,
  })

  const isStringChild = typeof children === 'string'
  const fallbackLabel = isStringChild ? children : undefined
  const ariaLabelText = ariaLabelProp ?? fallbackLabel
  const ariaLabel = descriptiveTooltipText ?? ariaLabelText

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Comp className={cn('button-icon', base(), className)} ref={ref} {...rest} aria-label={ariaLabel}>
              <span className={cn(childWrapper(), 'flex items-center gap-2')}>
                {loading && <LoaderCircle className={cn(loadingIcon(), 'relative!')} size={20} />}
                {children}
              </span>

              {!loading && icon && (
                <div className={iconOuter()}>
                  <div className={cn(iconInner(), variant === 'secondary' ? 'text-muted-foreground' : '')}>{icon}</div>
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
          </TooltipTrigger>
          {descriptiveTooltipText && (
            <TooltipContent side="bottom" sideOffset={8} align="center">
              {descriptiveTooltipText}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </>
  )
}

export { Button, buttonStyles }
