export const TOAST_VIEWPORT_SELECTOR = '[data-toast-viewport]'

export const INFO_PANEL_SELECTOR = '[data-info-panel]'

const GUARDED_SELECTOR = `${TOAST_VIEWPORT_SELECTOR},${INFO_PANEL_SELECTOR}`

type OutsideEvent = {
  target: EventTarget | null
  preventDefault: () => void
}

export const guardInteractOutside =
  <E extends OutsideEvent>(next?: (event: E) => void) =>
  (event: E) => {
    const target = event.target
    if (target instanceof Element && target.closest(GUARDED_SELECTOR)) {
      event.preventDefault()
      return
    }
    next?.(event)
  }
