export const TOAST_VIEWPORT_SELECTOR = '[data-toast-viewport]'

type OutsideEvent = {
  target: EventTarget | null
  preventDefault: () => void
}

/**
 * Radix renders toasts in their own DismissableLayer above modal overlays with
 * pointer-events enabled, so clicking or dismissing a toast is otherwise seen as
 * an "interact outside" by any open Dialog/Dropdown/Popover and closes it too.
 *
 * Wrap an overlay's `onInteractOutside` with this to swallow interactions that
 * originate inside a toast viewport while delegating everything else to `next`.
 */
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
