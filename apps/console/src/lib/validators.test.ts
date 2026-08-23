import { isPlausiblePhoneNumber } from './validators'

describe('isPlausiblePhoneNumber', () => {
  it.each(['', '+234 803 123 4567', '+44 20 7946 0958', '+1 (303) 456-7890', '0803 123 4567', '123.456.7890', '1234567890'])('accepts plausible phone-number input: %s', (phoneNumber: string) => {
    expect(isPlausiblePhoneNumber(phoneNumber)).toBe(true)
  })

  it.each(['123', 'phone', '+', '555-867+5309', '++2348031234567', '+0123456789', '1234567890123456'])('rejects malformed phone-number input: %s', (phoneNumber: string) => {
    expect(isPlausiblePhoneNumber(phoneNumber)).toBe(false)
  })

  it('leaves real-number validation to core', () => {
    expect(isPlausiblePhoneNumber('+1 555 867 5309')).toBe(true)
  })
})
