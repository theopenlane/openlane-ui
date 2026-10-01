import type { ReactNode } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Logo } from '@repo/ui/logo'
import { POPUP_THEME } from '../theme'

type TPopupHeaderProps = {
  onBack?: () => void
  action?: ReactNode
}

export const PopupHeader = ({ onBack, action }: TPopupHeaderProps) => (
  <header className="flex items-center gap-1 border-b px-3 py-2">
    {onBack && <Button variant="icon" size="icon-sm" icon={<ChevronLeft />} descriptiveTooltipText="Back" onClick={onBack} />}
    <div className="w-[118px]">
      <Logo theme={POPUP_THEME} width={118} height={23} />
    </div>
    <div className="ml-auto flex items-center gap-1">
      {action}
      <Button variant="icon" size="icon-sm" icon={<X />} descriptiveTooltipText="Close" onClick={() => window.close()} />
    </div>
  </header>
)

type TScreenTitleProps = {
  title: string
  description?: string
}

export const ScreenTitle = ({ title, description }: TScreenTitleProps) => (
  <div className="space-y-1">
    <h1 className="text-lg font-semibold leading-tight">{title}</h1>
    {description && <p className="text-sm text-muted-foreground">{description}</p>}
  </div>
)
