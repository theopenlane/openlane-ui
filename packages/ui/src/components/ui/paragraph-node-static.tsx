import { SlateElement, type SlateElementProps } from 'platejs/static'

import { cn } from '@theopenlane/ui/lib/utils'

export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className={cn('m-0 px-0 py-1')}>
      {props.children}
    </SlateElement>
  )
}
