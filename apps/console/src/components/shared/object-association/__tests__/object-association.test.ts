import { getAssociationDiffs, buildMutationKey, getAssociationInput, buildAssociationPayload } from '../utils'
import {
  ObjectTypeObjects,
  OBJECT_QUERY_CONFIG,
  ASSOCIATION_SECTION_CONFIG,
  ASSOCIATION_SECTION_QUERY_KEY,
  ASSOCIATION_REMOVAL_CONFIG,
  generateWhere,
  extractTableRows,
  getPagination,
  toRemoveFieldName,
} from '../object-association-config'

// ---------------------------------------------------------------------------
// Suite 1: getAssociationDiffs
// ---------------------------------------------------------------------------
describe('getAssociationDiffs', () => {
  it('returns empty added/removed when there are no changes', () => {
    const map = { taskIDs: ['1', '2'] }
    const { added, removed } = getAssociationDiffs(map, map)
    expect(added).toEqual({})
    expect(removed).toEqual({})
  })

  it('detects items added to one key', () => {
    const initial = { taskIDs: ['1'] }
    const current = { taskIDs: ['1', '2'] }
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({ taskIDs: ['2'] })
    expect(removed).toEqual({})
  })

  it('detects items removed from one key', () => {
    const initial = { taskIDs: ['1', '2'] }
    const current = { taskIDs: ['1'] }
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({})
    expect(removed).toEqual({ taskIDs: ['2'] })
  })

  it('detects items added and removed in the same key', () => {
    const initial = { taskIDs: ['1', '2'] }
    const current = { taskIDs: ['2', '3'] }
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({ taskIDs: ['3'] })
    expect(removed).toEqual({ taskIDs: ['1'] })
  })

  it('handles multiple keys with mixed changes without cross-contamination', () => {
    const initial = { taskIDs: ['1'], riskIDs: ['a', 'b'] }
    const current = { taskIDs: ['1', '2'], riskIDs: ['b'] }
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({ taskIDs: ['2'] })
    expect(removed).toEqual({ riskIDs: ['a'] })
  })

  it('handles key that exists in initial but not current (all removed)', () => {
    const initial = { taskIDs: ['1', '2'] }
    const current: Record<string, string[]> = {}
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({})
    expect(removed).toEqual({ taskIDs: ['1', '2'] })
  })

  it('handles key that exists in current but not initial (new key)', () => {
    const initial: Record<string, string[]> = {}
    const current = { taskIDs: ['1'] }
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({ taskIDs: ['1'] })
    expect(removed).toEqual({})
  })

  it('returns empty results for empty arrays on both sides', () => {
    const initial = { taskIDs: [] as string[] }
    const current = { taskIDs: [] as string[] }
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({})
    expect(removed).toEqual({})
  })

  it('deduplicates input IDs via Set without data loss', () => {
    const initial = { taskIDs: ['1', '1', '2'] }
    const current = { taskIDs: ['2', '2', '3'] }
    const { added, removed } = getAssociationDiffs(initial, current)
    expect(added).toEqual({ taskIDs: ['3'] })
    expect(removed).toEqual({ taskIDs: ['1'] })
  })
})

// ---------------------------------------------------------------------------
// Suite 2: buildMutationKey
// ---------------------------------------------------------------------------
describe('buildMutationKey', () => {
  it('builds add key for taskIDs', () => {
    expect(buildMutationKey('add', 'taskIDs')).toBe('addTaskIDs')
  })

  it('builds remove key for taskIDs', () => {
    expect(buildMutationKey('remove', 'taskIDs')).toBe('removeTaskIDs')
  })

  it('capitalizes first char of controlIDs', () => {
    expect(buildMutationKey('add', 'controlIDs')).toBe('addControlIDs')
  })

  it('handles single-char key', () => {
    expect(buildMutationKey('add', 'x')).toBe('addX')
  })
})

// ---------------------------------------------------------------------------
// Suite 3: getAssociationInput
// ---------------------------------------------------------------------------
describe('getAssociationInput', () => {
  it('returns empty object when there are no changes', () => {
    const map = { taskIDs: ['1'] }
    expect(getAssociationInput(map, map)).toEqual({})
  })

  it('returns only add keys when items are added', () => {
    const initial = { taskIDs: ['1'] }
    const current = { taskIDs: ['1', '2'] }
    expect(getAssociationInput(initial, current)).toEqual({ addTaskIDs: ['2'] })
  })

  it('returns only remove keys when items are removed', () => {
    const initial = { taskIDs: ['1', '2'] }
    const current = { taskIDs: ['1'] }
    expect(getAssociationInput(initial, current)).toEqual({ removeTaskIDs: ['2'] })
  })

  it('returns both add and remove keys for mixed changes', () => {
    const initial = { taskIDs: ['1', '2'] }
    const current = { taskIDs: ['2', '3'] }
    expect(getAssociationInput(initial, current)).toEqual({
      addTaskIDs: ['3'],
      removeTaskIDs: ['1'],
    })
  })

  it('handles real-world swap scenario', () => {
    const initial = { riskIDs: ['risk-a'] }
    const current = { riskIDs: ['risk-b'] }
    expect(getAssociationInput(initial, current)).toEqual({
      addRiskIDs: ['risk-b'],
      removeRiskIDs: ['risk-a'],
    })
  })
})

// ---------------------------------------------------------------------------
// Suite 4: buildAssociationPayload
// ---------------------------------------------------------------------------
describe('buildAssociationPayload', () => {
  const keys = ['taskIDs', 'riskIDs'] as const

  it('returns raw IDs in create mode', () => {
    const formData = { taskIDs: ['1', '2'], riskIDs: ['a'] }
    const result = buildAssociationPayload(keys, formData, true, {})
    expect(result).toEqual({ taskIDs: ['1', '2'], riskIDs: ['a'] })
  })

  it('returns add/remove diff in update mode', () => {
    const initial = { taskIDs: ['1'], riskIDs: ['a'] }
    const formData = { taskIDs: ['1', '2'], riskIDs: ['a'] }
    const result = buildAssociationPayload(keys, formData, false, initial)
    expect(result).toEqual({ addTaskIDs: ['2'] })
  })

  it('returns empty object in create mode with empty fields', () => {
    const formData = { taskIDs: [] as string[], riskIDs: [] as string[] }
    const result = buildAssociationPayload(keys, formData, true, {})
    expect(result).toEqual({})
  })

  it('returns empty object in update mode with no changes', () => {
    const initial = { taskIDs: ['1'] }
    const formData = { taskIDs: ['1'] }
    const result = buildAssociationPayload(keys, formData, false, initial)
    expect(result).toEqual({})
  })

  it('only includes listed associationKeys, ignoring extra form fields', () => {
    const formData = { taskIDs: ['1'], riskIDs: undefined, extraField: ['should-not-appear'] } as Record<string, string[] | undefined>
    const result = buildAssociationPayload(keys, formData, true, {})
    expect(result).toEqual({ taskIDs: ['1'] })
    expect(result).not.toHaveProperty('extraField')
  })
})

// ---------------------------------------------------------------------------
// Suite 5: generateWhere
// ---------------------------------------------------------------------------
describe('generateWhere', () => {
  const ownerID = 'org-123'

  it('returns mandatory filter only when search is empty', () => {
    const result = generateWhere(ObjectTypeObjects.CONTROL, '', ownerID)
    expect(result).toEqual({ systemOwned: false })
  })

  it('returns or clause with primary and secondary search fields', () => {
    const result = generateWhere(ObjectTypeObjects.CONTROL, 'test', ownerID)
    expect(result).toEqual({
      systemOwned: false,
      or: [{ refCodeContainsFold: 'test' }, { descriptionContainsFold: 'test' }],
    })
  })

  it('returns single or entry for object type with no secondary search', () => {
    const result = generateWhere(ObjectTypeObjects.GROUP, 'test', ownerID)
    expect(result).toEqual({
      ownerID: 'org-123',
      or: [{ nameContainsFold: 'test' }],
    })
  })

  it('has mandatory filter entry for every ObjectTypeObjects', () => {
    for (const objectType of Object.values(ObjectTypeObjects)) {
      const result = generateWhere(objectType, '', ownerID)
      expect(result).toBeDefined()
    }
  })

  it('has search attribute for every ObjectTypeObjects', () => {
    for (const objectType of Object.values(ObjectTypeObjects)) {
      const result = generateWhere(objectType, 'search', ownerID)
      expect(result).toHaveProperty('or')
      expect((result as Record<string, unknown[]>).or.length).toBeGreaterThan(0)
    }
  })

  it('passes ownerID through for org-scoped objects', () => {
    const orgScopedTypes = [
      ObjectTypeObjects.CONTROL_OBJECTIVE,
      ObjectTypeObjects.PROGRAM,
      ObjectTypeObjects.TASK,
      ObjectTypeObjects.EVIDENCE,
      ObjectTypeObjects.GROUP,
      ObjectTypeObjects.RISK,
      ObjectTypeObjects.CAMPAIGN,
      ObjectTypeObjects.ASSET,
      ObjectTypeObjects.IDENTITY_HOLDER,
    ]
    for (const objectType of orgScopedTypes) {
      const result = generateWhere(objectType, '', ownerID)
      expect(result).toHaveProperty('ownerID', ownerID)
    }
  })

  it('applies systemOwned filter to correct types', () => {
    const systemOwnedTypes = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.INTERNAL_POLICY, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.ENTITY]
    for (const objectType of systemOwnedTypes) {
      const result = generateWhere(objectType, '', ownerID)
      expect(result).toHaveProperty('systemOwned', false)
    }
  })
})

// ---------------------------------------------------------------------------
// Suite 6: extractTableRows
// ---------------------------------------------------------------------------
describe('extractTableRows', () => {
  it('handles every responseObjectKey (no type returns empty due to missing case)', () => {
    const allObjectKeys = Object.values(OBJECT_QUERY_CONFIG).map((c) => c.responseObjectKey)
    for (const objectKey of allObjectKeys) {
      const mockNode = {
        id: 'test-id',
        name: 'test',
        refCode: 'REF-001',
        title: 'test',
        target: 'test',
        fullName: 'test',
        details: 'test',
        displayID: 'TST-001',
        displayName: 'test',
        controls: { edges: [{ node: { refCode: 'CTL-001' } }] },
      }
      const data = {
        [objectKey]: {
          edges: [{ node: mockNode }],
          pageInfo: { hasNextPage: false },
          totalCount: 1,
        },
      }
      const rows = extractTableRows(objectKey, data as never)
      expect(rows.length).toBeGreaterThan(0)
    }
  })

  it('maps controls to use refCode as name', () => {
    const data = {
      controls: { edges: [{ node: { id: '1', refCode: 'CTL-001' } }] },
    }
    const rows = extractTableRows('controls', data as never)
    expect(rows[0].name).toBe('CTL-001')
  })

  it('maps tasks to use title as name', () => {
    const data = {
      tasks: { edges: [{ node: { id: '1', title: 'My Task', displayID: 'TSK-001' } }] },
    }
    const rows = extractTableRows('tasks', data as never)
    expect(rows[0].name).toBe('My Task')
  })

  it('maps identityHolders to use fullName as name', () => {
    const data = {
      identityHolders: { edges: [{ node: { id: '1', fullName: 'John Doe', displayID: 'PER-001' } }] },
    }
    const rows = extractTableRows('identityHolders', data as never)
    expect(rows[0].name).toBe('John Doe')
  })

  it('maps scans to use target as name', () => {
    const data = {
      scans: { edges: [{ node: { id: '1', target: 'example.com' } }] },
    }
    const rows = extractTableRows('scans', data as never)
    expect(rows[0].name).toBe('example.com')
  })

  it('maps controlImplementations traversing nested control edges', () => {
    const data = {
      controlImplementations: {
        edges: [
          {
            node: {
              id: '1',
              controls: { edges: [{ node: { refCode: 'CTL-001' } }] },
              details: 'Implementation details',
            },
          },
        ],
      },
    }
    const rows = extractTableRows('controlImplementations', data as never)
    expect(rows[0].name).toBe('CTL-001')
  })

  it('returns empty array for empty edges', () => {
    const data = { controls: { edges: [] } }
    expect(extractTableRows('controls', data as never)).toEqual([])
  })

  it('falls back to empty string for missing node fields', () => {
    const data = { tasks: { edges: [{ node: { id: '1' } }] } }
    const rows = extractTableRows('tasks', data as never)
    expect(rows[0].name).toBe('')
    expect(rows[0].id).toBe('1')
  })
})

// ---------------------------------------------------------------------------
// Suite 7: Config integrity
// ---------------------------------------------------------------------------
describe('Config integrity', () => {
  it('every ObjectTypeObjects has an OBJECT_QUERY_CONFIG entry', () => {
    for (const objectType of Object.values(ObjectTypeObjects)) {
      expect(OBJECT_QUERY_CONFIG).toHaveProperty(objectType)
    }
  })

  it('every ASSOCIATION_SECTION_CONFIG key has an ASSOCIATION_SECTION_QUERY_KEY entry', () => {
    for (const key of Object.keys(ASSOCIATION_SECTION_CONFIG)) {
      expect(ASSOCIATION_SECTION_QUERY_KEY).toHaveProperty(key)
    }
  })

  it('every OBJECT_QUERY_CONFIG inputName matches an ASSOCIATION_SECTION_CONFIG inputName', () => {
    const sectionInputNames = new Set<string>(Object.values(ASSOCIATION_SECTION_CONFIG).map((s) => s.inputName))
    for (const config of Object.values(OBJECT_QUERY_CONFIG)) {
      expect(sectionInputNames.has(config.inputName)).toBe(true)
    }
  })

  it('all ASSOCIATION_REMOVAL_CONFIG section keys exist in ASSOCIATION_SECTION_CONFIG', () => {
    const validSectionKeys = new Set(Object.keys(ASSOCIATION_SECTION_CONFIG))
    for (const config of Object.values(ASSOCIATION_REMOVAL_CONFIG)) {
      for (const sectionKey of Object.keys(config.sectionKeyToDataField)) {
        expect(validSectionKeys.has(sectionKey)).toBe(true)
      }
    }
  })

  it('all ASSOCIATION_REMOVAL_CONFIG invalidation query keys are defined', () => {
    for (const config of Object.values(ASSOCIATION_REMOVAL_CONFIG)) {
      for (const queryKey of Object.values(config.sectionKeyToInvalidateQueryKey)) {
        expect(queryKey).toBeDefined()
        expect(Array.isArray(queryKey)).toBe(true)
        expect((queryKey as readonly unknown[]).length).toBeGreaterThan(0)
      }
    }
  })

  it('getPagination handles every responseObjectKey from OBJECT_QUERY_CONFIG', () => {
    const allObjectKeys = new Set(Object.values(OBJECT_QUERY_CONFIG).map((c) => c.responseObjectKey))
    for (const objectKey of allObjectKeys) {
      const mockData = {
        [objectKey]: {
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          totalCount: 42,
        },
      }
      const result = getPagination(objectKey, mockData as never)
      expect(result.pageInfo).toBeDefined()
      expect(result.totalCount).toBe(42)
    }
  })
})

// ---------------------------------------------------------------------------
// Suite 8: toRemoveFieldName
// ---------------------------------------------------------------------------
describe('toRemoveFieldName', () => {
  it('converts controlIDs to removeControlIDs', () => {
    expect(toRemoveFieldName('controlIDs')).toBe('removeControlIDs')
  })

  it('converts internalPolicyIDs to removeInternalPolicyIDs', () => {
    expect(toRemoveFieldName('internalPolicyIDs')).toBe('removeInternalPolicyIDs')
  })
})
