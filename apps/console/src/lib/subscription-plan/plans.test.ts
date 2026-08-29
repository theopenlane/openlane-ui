import { type Session } from 'next-auth'
import { arePlanChecksDisabled, featureUtil } from './plans'
import { PlanEnum } from './plan-enum'

/**
 * #1969 — support sessions carry no subscription modules, so every module gate has to treat an
 * impersonation session as fully entitled. Without the bypass a support engineer lands in an org
 * with the whole sidebar locked and the billing reported as expired.
 */

const session = (over: Partial<Session['user']> = {}): Session =>
  ({
    user: { modules: [], ...over },
  }) as unknown as Session

const support = () => session({ isImpersonation: true })

const originalEnablePlan = process.env.NEXT_PUBLIC_ENABLE_PLAN

beforeEach(() => {
  // Plan checks ON unless a test opts out, so the impersonation bypass is what
  // is actually under test rather than the env short-circuit.
  process.env.NEXT_PUBLIC_ENABLE_PLAN = 'true'
})

afterAll(() => {
  if (originalEnablePlan === undefined) delete process.env.NEXT_PUBLIC_ENABLE_PLAN
  else process.env.NEXT_PUBLIC_ENABLE_PLAN = originalEnablePlan
})

describe('featureUtil.hasModule', () => {
  test('is true when the user holds the required module', () => {
    expect(featureUtil.hasModule([PlanEnum.COMPLIANCE_MODULE], PlanEnum.COMPLIANCE_MODULE)).toBe(true)
  })

  test('is false when the user does not hold it', () => {
    expect(featureUtil.hasModule([], PlanEnum.COMPLIANCE_MODULE)).toBe(false)
  })

  test('is true for a support session that holds no modules at all', () => {
    expect(featureUtil.hasModule([], PlanEnum.COMPLIANCE_MODULE, support())).toBe(true)
  })

  test('still gates a normal session even when one is passed', () => {
    expect(featureUtil.hasModule([], PlanEnum.COMPLIANCE_MODULE, session())).toBe(false)
  })

  test('is true for everyone when plan checks are disabled', () => {
    process.env.NEXT_PUBLIC_ENABLE_PLAN = 'false'
    expect(featureUtil.hasModule([], PlanEnum.COMPLIANCE_MODULE)).toBe(true)
  })
})

describe('featureUtil.hasNoModules', () => {
  test('is false without a session', () => {
    expect(featureUtil.hasNoModules(null)).toBe(false)
  })

  test('is true for a normal session with an empty module list', () => {
    expect(featureUtil.hasNoModules(session({ modules: [] }))).toBe(true)
  })

  test('is false for a normal session that holds a module', () => {
    expect(featureUtil.hasNoModules(session({ modules: [PlanEnum.COMPLIANCE_MODULE] }))).toBe(false)
  })

  test('is false for a support session despite an empty module list', () => {
    // This is the bug the commit fixed: a support session would otherwise read
    // as billing-expired and hide the whole nav.
    expect(featureUtil.hasNoModules(support())).toBe(false)
  })

  test('is false for everyone when plan checks are disabled', () => {
    process.env.NEXT_PUBLIC_ENABLE_PLAN = 'false'
    expect(featureUtil.hasNoModules(session({ modules: [] }))).toBe(false)
  })
})

describe('featureUtil.hasObjectType', () => {
  test('is true for a support session regardless of modules', () => {
    expect(featureUtil.hasObjectType([], 'Control' as never, support())).toBe(true)
  })

  test('is true when the object type is not module-gated', () => {
    // Object types absent from MODULES_BY_OBJECT_TYPE require nothing.
    expect(featureUtil.hasObjectType([], '__NotGated__' as never)).toBe(true)
  })
})

/**
 * ISS-2588 — module gating was consolidated so tables, filters and layouts all
 * consult the same map instead of hand-rolled FeatureGate wrappers.
 * getUpgradeModules is the lookup: an object type ABSENT from the map requires
 * nothing, which is what keeps ungated features working rather than locking them
 * out by default.
 */
describe('featureUtil.getUpgradeModules', () => {
  test('requires nothing for an object type that is not module-gated', () => {
    expect(featureUtil.getUpgradeModules('__NotGated__' as never)).toEqual([])
  })

  test('returns modules for a gated object type', () => {
    const modules = featureUtil.getUpgradeModules('Control' as never)

    expect(Array.isArray(modules)).toBe(true)
  })

  test('never returns undefined, so callers can spread the result safely', () => {
    for (const objectType of ['Control', 'Evidence', '__Unknown__']) {
      expect(featureUtil.getUpgradeModules(objectType as never)).toBeDefined()
    }
  })
})

describe('featureUtil.getPlanName', () => {
  test('gives every plan a human name', () => {
    expect(featureUtil.getPlanName(PlanEnum.COMPLIANCE_MODULE)).toBe('Compliance')
    expect(featureUtil.getPlanName(PlanEnum.TRUST_CENTER_MODULE)).toBe('Trust Center')
  })

  test('names every member of the plan enum', () => {
    for (const plan of Object.values(PlanEnum)) {
      expect(featureUtil.getPlanName(plan)).toBeTruthy()
    }
  })
})

describe('arePlanChecksDisabled', () => {
  test('tracks the env flag exactly, not merely its truthiness', () => {
    process.env.NEXT_PUBLIC_ENABLE_PLAN = 'false'
    expect(arePlanChecksDisabled()).toBe(true)

    process.env.NEXT_PUBLIC_ENABLE_PLAN = 'true'
    expect(arePlanChecksDisabled()).toBe(false)

    // Anything other than the literal 'false' leaves checks ON.
    process.env.NEXT_PUBLIC_ENABLE_PLAN = ''
    expect(arePlanChecksDisabled()).toBe(false)
  })
})
