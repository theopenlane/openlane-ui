import { runSSOCallbackOnce } from './run-sso-callback-once'

describe('runSSOCallbackOnce', () => {
  it('submits the SSO callback only once when the effect runs more than once', () => {
    const guard = { current: false }
    const submitCallback = jest.fn()

    expect(runSSOCallbackOnce(guard, submitCallback)).toBe(true)
    expect(runSSOCallbackOnce(guard, submitCallback)).toBe(false)

    expect(submitCallback).toHaveBeenCalledTimes(1)
  })
})
