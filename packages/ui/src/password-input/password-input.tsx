'use client'

import { forwardRef, useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Input, InputProps } from '../input/input'
import { cn } from '../../lib/utils'
import { passwordInputStyles } from './password-input.styles'

const PasswordInput = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const { eye } = passwordInputStyles()

  return (
    <div className="relative">
      <Input type={showPassword ? 'text' : 'password'} className={cn('hide-password-toggle pr-10', className)} ref={ref} {...props} />
      <button
        type="button"
        className="absolute z-20 right-0 top-0 h-full px-3 py-2 bg-unset"
        onClick={() => {
          setShowPassword((prev) => !prev)
        }}
      >
        {showPassword ? <EyeIcon className={eye()} aria-hidden="true" /> : <EyeOffIcon className={eye()} aria-hidden="true" />}
        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
      </button>

      {/* hides browsers password toggles */}
      <style>{`
					.hide-password-toggle::-ms-reveal,
					.hide-password-toggle::-ms-clear {
						visibility: hidden;
						pointer-events: none;
						display: none;
					}
				`}</style>
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
