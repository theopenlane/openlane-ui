import { type KeyboardEvent, type MouseEvent } from 'react'

type ActivateHandler<T extends Element> = (event: MouseEvent<T> | KeyboardEvent<T>) => void

type ActivatableProps<T extends Element> = {
  role?: 'button'
  tabIndex?: 0
  onClick?: ActivateHandler<T>
  onKeyDown?: (event: KeyboardEvent<T>) => void
}

export const onActivateKeyDown =
  <T extends Element>(activate: ActivateHandler<T>) =>
  (event: KeyboardEvent<T>) => {
    if (event.target !== event.currentTarget) {
      return
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }
    event.preventDefault()
    activate(event)
  }

export const activatable = <T extends Element>(activate?: ActivateHandler<T>): ActivatableProps<T> =>
  activate ? { role: 'button', tabIndex: 0, onClick: activate, onKeyDown: onActivateKeyDown(activate) } : {}
