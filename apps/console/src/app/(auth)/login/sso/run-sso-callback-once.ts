type CallbackGuard = { current: boolean }

export const runSSOCallbackOnce = (guard: CallbackGuard, callback: () => void | Promise<void>) => {
  if (guard.current) return false

  guard.current = true
  void callback()
  return true
}
