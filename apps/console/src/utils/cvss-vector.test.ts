import { explainCvssVector, getCvssRadarData, getCvssSeverityBand, parseCvssVector } from './cvss-vector'

const V31_CRITICAL = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'
const V40_CRITICAL = 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N'

describe('parseCvssVector', () => {
  test('parses a CVSS 3.1 vector into its version and metrics', () => {
    expect(parseCvssVector(V31_CRITICAL)).toEqual({
      version: '3.1',
      metrics: { AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H' },
    })
  })

  test('parses CVSS 3.0 and 4.0 vectors', () => {
    expect(parseCvssVector('CVSS:3.0/AV:L/AC:H/PR:H/UI:R/S:C/C:N/I:L/A:N')?.version).toBe('3.0')
    expect(parseCvssVector(V40_CRITICAL)?.version).toBe('4.0')
  })

  test('trims surrounding whitespace', () => {
    expect(parseCvssVector(`  ${V31_CRITICAL}  `)?.version).toBe('3.1')
  })

  test('keeps temporal and environmental metrics beyond the base set', () => {
    expect(parseCvssVector(`${V31_CRITICAL}/E:P/RL:O`)?.metrics).toMatchObject({ E: 'P', RL: 'O' })
  })

  test('returns null for empty input', () => {
    expect(parseCvssVector(undefined)).toBeNull()
    expect(parseCvssVector(null)).toBeNull()
    expect(parseCvssVector('')).toBeNull()
  })

  test('rejects a vector without a supported CVSS prefix', () => {
    expect(parseCvssVector('AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBeNull()
    expect(parseCvssVector('CVSS:2.0/AV:N/AC:L/Au:N/C:P/I:P/A:P')).toBeNull()
    expect(parseCvssVector('cvss:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBeNull()
    expect(parseCvssVector('CVSS:3.1')).toBeNull()
  })

  test('rejects a vector missing a base metric', () => {
    expect(parseCvssVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H')).toBeNull()
  })

  test('rejects a base metric with a value outside its scale', () => {
    expect(parseCvssVector('CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBeNull()
    expect(parseCvssVector('CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:R/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N')).toBeNull()
  })

  test('rejects malformed and duplicated metrics', () => {
    expect(parseCvssVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/oops')).toBeNull()
    expect(parseCvssVector('CVSS:3.1/AV:N/AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBeNull()
  })

  test('does not treat inherited object keys as a version prefix', () => {
    expect(parseCvssVector('constructor/AV:N')).toBeNull()
    expect(parseCvssVector('__proto__/AV:N')).toBeNull()
  })
})

describe('getCvssRadarData', () => {
  test('emits one point per base metric, scaled from 0 to 1', () => {
    const parsed = parseCvssVector(V31_CRITICAL)
    if (!parsed) throw new Error('expected a parsed vector')

    const points = getCvssRadarData(parsed)

    expect(points.map((point) => point.axis)).toEqual(['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'])
    expect(points.find((point) => point.axis === 'AV')).toEqual({ axis: 'AV', value: 1, tooltip: 'AV: N' })
    expect(points.find((point) => point.axis === 'S')?.value).toBe(0)
  })
})

describe('explainCvssVector', () => {
  test('describes a 3.1 network vector with full impact', () => {
    expect(explainCvssVector(V31_CRITICAL)).toBe(
      'Can be exploited over the network without an account, with no user interaction. If exploited, an attacker can read sensitive data, change any data, and take it down.',
    )
  })

  test('describes a 4.0 vector that only affects connected systems', () => {
    expect(explainCvssVector('CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:N/VI:N/VA:N/SC:H/SI:N/SA:N')).toContain(
      'The vulnerable component itself isn’t affected, but systems connected to it can have data read.',
    )
  })

  test('returns null for an invalid vector', () => {
    expect(explainCvssVector('not-a-vector')).toBeNull()
  })
})

describe('getCvssSeverityBand', () => {
  test.each([
    [0, 'None'],
    [0.1, 'Low'],
    [3.9, 'Low'],
    [4, 'Medium'],
    [6.9, 'Medium'],
    [7, 'High'],
    [8.9, 'High'],
    [9, 'Critical'],
    [10, 'Critical'],
  ])('maps %p to %p', (score, label) => {
    expect(getCvssSeverityBand(score)?.label).toBe(label)
  })

  test('returns null for missing or out-of-range scores', () => {
    expect(getCvssSeverityBand(null)).toBeNull()
    expect(getCvssSeverityBand(undefined)).toBeNull()
    expect(getCvssSeverityBand(Number.NaN)).toBeNull()
    expect(getCvssSeverityBand(-1)).toBeNull()
    expect(getCvssSeverityBand(10.1)).toBeNull()
  })
})
