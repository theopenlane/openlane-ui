export const TOAST_VIEWPORT_SELECTOR = '[data-toast-viewport]'

type OutsideEvent = {
  target: EventTarget | null
  preventDefault: () => void
}

export const guardToastInteractOutside =
  <E extends OutsideEvent>(next?: (event: E) => void) =>
  (event: E) => {
    const target = event.target
    if (target instanceof Element && target.closest(TOAST_VIEWPORT_SELECTOR)) {
      event.preventDefault()
      return
    }
    next?.(event)
  }
