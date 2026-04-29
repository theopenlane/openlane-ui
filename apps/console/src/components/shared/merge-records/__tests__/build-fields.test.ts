import { buildMergeFields, DEFAULT_MERGE_EXCLUDED_KEYS } from '../build-fields'
import type { MergeFieldOverrides } from '../types'

describe('buildMergeFields - humanizer', () => {
  it('produces sentence case for camelCase keys', () => {
    const sample = { displayName: 'foo' }
    const [field] = buildMergeFields(sample)
    expect(field.label).toBe('Display name')
  })

  it('preserves all-caps acronyms inside the label', () => {
    const sample = { externalReferenceID: 'x', externalUserID: 'y', avatarRemoteURL: 'z' }
    const labels = buildMergeFields(sample).map((f) => f.label)
    expect(labels).toEqual(['External reference ID', 'External user ID', 'Avatar remote URL'])
  })

  it('handles snake_case and kebab-case keys', () => {
    const sample = { snake_case_key: 'a', 'kebab-case-key': 'b' }
    const labels = buildMergeFields(sample).map((f) => f.label)
    expect(labels).toEqual(['Snake case key', 'Kebab case key'])
  })

  it('keeps single-letter words lowercased after the first', () => {
    const sample = { aField: 'x' }
    const [field] = buildMergeFields(sample)
    expect(field.label).toBe('A field')
  })

  it('humanizes a single-word key', () => {
    const sample = { name: 'a' }
    const [field] = buildMergeFields(sample)
    expect(field.label).toBe('Name')
  })
})

describe('buildMergeFields - type inference', () => {
  it('infers text for string values', () => {
    const sample = { name: 'x' }
    const [field] = buildMergeFields(sample)
    expect(field.type).toBe('text')
  })

  it('infers boolean for boolean values', () => {
    const sample = { isActive: true, containsPii: false }
    const types = buildMergeFields(sample).map((f) => f.type)
    expect(types).toEqual(['boolean', 'boolean'])
  })

  it('infers number for number values', () => {
    const sample = { annualSpend: 1000 }
    const [field] = buildMergeFields(sample)
    expect(field.type).toBe('number')
  })

  it('infers tags for string arrays', () => {
    const sample = { tags: ['a', 'b'], emailAliases: [] as string[] }
    const types = buildMergeFields(sample).map((f) => f.type)
    expect(types).toEqual(['tags', 'tags'])
  })

  it('infers map for plain object values', () => {
    const sample = { metadata: { foo: 'bar' } }
    const [field] = buildMergeFields(sample)
    expect(field.type).toBe('map')
  })

  it('infers date for keys ending in Date', () => {
    const sample = { startDate: '2026-01-01', purchaseDate: null as string | null }
    const types = buildMergeFields(sample).map((f) => f.type)
    expect(types).toEqual(['date', 'date'])
  })

  it('infers date for keys ending in At', () => {
    const sample = { lastReviewedAt: '2026-01-01', nextReviewAt: '2026-02-01' }
    const types = buildMergeFields(sample).map((f) => f.type)
    expect(types).toEqual(['date', 'date'])
  })

  it('falls back to text when value is null/undefined and no Date|At suffix', () => {
    const sample = { description: null as string | null, summary: undefined as string | undefined }
    const types = buildMergeFields(sample).map((f) => f.type)
    expect(types).toEqual(['text', 'text'])
  })
})

describe('buildMergeFields - default exclusions', () => {
  it('excludes meta fields', () => {
    const sample = {
      id: '1',
      __typename: 'Foo',
      displayID: 'F-1',
      createdAt: '2026-01-01',
      createdBy: 'u1',
      updatedAt: '2026-01-02',
      updatedBy: 'u2',
      deletedAt: null,
      deletedBy: null,
      ownerID: 'org',
      ownerName: 'Org',
      environmentID: 'e',
      environmentName: 'env',
      scopeID: 's',
      scopeName: 'scope',
      systemInternalID: 'i',
      systemOwned: false,
      isOpenlaneUser: false,
      name: 'kept',
    }
    const fields = buildMergeFields(sample)
    expect(fields.map((f) => f.key)).toEqual(['name'])
  })

  it('exposes the default excluded keys set', () => {
    expect(DEFAULT_MERGE_EXCLUDED_KEYS.has('id')).toBe(true)
    expect(DEFAULT_MERGE_EXCLUDED_KEYS.has('createdAt')).toBe(true)
    expect(DEFAULT_MERGE_EXCLUDED_KEYS.has('name')).toBe(false)
  })
})

describe('buildMergeFields - edge/connection detection', () => {
  it('skips connections shaped like { edges: [...] }', () => {
    const sample = {
      name: 'kept',
      assets: { edges: [{ node: { id: '1' } }] },
    }
    const keys = buildMergeFields(sample).map((f) => f.key)
    expect(keys).toEqual(['name'])
  })

  it('skips connections shaped like { pageInfo, totalCount }', () => {
    const sample = {
      name: 'kept',
      assets: { pageInfo: {}, totalCount: 0 },
    }
    const keys = buildMergeFields(sample).map((f) => f.key)
    expect(keys).toEqual(['name'])
  })

  it('skips empty connections still shaped like { edges: [] }', () => {
    const sample = { name: 'kept', controls: { edges: [] } }
    const keys = buildMergeFields(sample).map((f) => f.key)
    expect(keys).toEqual(['name'])
  })

  it('skips arrays of non-strings (e.g. nested objects)', () => {
    const sample = { name: 'kept', historyEntries: [{ id: '1' }] as unknown as string[] }
    const keys = buildMergeFields(sample).map((f) => f.key)
    expect(keys).toEqual(['name'])
  })

  it('skips class instances and other non-plain objects', () => {
    class Custom {
      foo = 'bar'
    }
    const sample = { name: 'kept', instance: new Custom() as unknown as Record<string, unknown> }
    const keys = buildMergeFields(sample).map((f) => f.key)
    expect(keys).toEqual(['name'])
  })

  it('keeps plain objects as map values when they are not edges', () => {
    const sample = { metadata: { foo: 'bar' } }
    const fields = buildMergeFields(sample)
    expect(fields).toEqual([{ key: 'metadata', label: 'Metadata', type: 'map' }])
  })
})

describe('buildMergeFields - per-config exclude', () => {
  it('honors excludeExtra in addition to defaults', () => {
    const sample = { name: 'kept', userID: 'u', employerEntityID: 'e' }
    const keys = buildMergeFields(sample, {}, ['userID', 'employerEntityID']).map((f) => f.key)
    expect(keys).toEqual(['name'])
  })

  it('exclude wins over override when the same key is in both', () => {
    const sample = { name: 'kept', secret: 's' }
    const overrides: MergeFieldOverrides<typeof sample> = { secret: { label: 'Secret', type: 'text' } }
    const keys = buildMergeFields(sample, overrides, ['secret']).map((f) => f.key)
    expect(keys).toEqual(['name'])
  })
})

describe('buildMergeFields - overrides', () => {
  it('applies type and label overrides', () => {
    const sample = { description: 'text', status: 'ACTIVE' }
    const overrides: MergeFieldOverrides<typeof sample> = {
      description: { label: 'Description', type: 'longText' },
      status: { label: 'Status', type: 'enum', enumOptions: [{ value: 'ACTIVE', label: 'Active' }] },
    }
    const fields = buildMergeFields(sample, overrides)
    expect(fields).toEqual([
      { key: 'description', label: 'Description', type: 'longText' },
      { key: 'status', label: 'Status', type: 'enum', enumOptions: [{ value: 'ACTIVE', label: 'Active' }] },
    ])
  })

  it('does not double-emit when both inferred and overridden', () => {
    const sample = { tags: ['a'] }
    const overrides: MergeFieldOverrides<typeof sample> = { tags: { label: 'Tags', type: 'tags' } }
    const fields = buildMergeFields(sample, overrides)
    expect(fields).toHaveLength(1)
    expect(fields[0]).toEqual({ key: 'tags', label: 'Tags', type: 'tags' })
  })

  it('preserves the order of the sample keys', () => {
    const sample = { fullName: 'a', email: 'b', status: 'ACTIVE' }
    const overrides: MergeFieldOverrides<typeof sample> = { status: { label: 'Status', type: 'enum' } }
    const keys = buildMergeFields(sample, overrides).map((f) => f.key)
    expect(keys).toEqual(['fullName', 'email', 'status'])
  })
})

describe('buildMergeFields - representative samples', () => {
  it('produces the expected field list for an Asset-like record', () => {
    const sample = {
      __typename: 'Asset',
      id: '1',
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      environmentID: '',
      environmentName: '',
      scopeID: '',
      scopeName: '',
      name: 'web',
      displayName: 'Web',
      identifier: 'web-1',
      description: 'long',
      assetType: 'SOFTWARE',
      sourceType: 'MANUAL',
      accessModelName: 'public',
      assetDataClassificationName: 'public',
      assetSubtypeName: null,
      criticalityName: null,
      encryptionStatusName: null,
      securityTierName: null,
      costCenter: null,
      cpe: null,
      containsPii: false,
      estimatedMonthlyCost: 0,
      region: null,
      website: null,
      physicalLocation: null,
      purchaseDate: null,
      tags: ['t1'],
      categories: ['c1'],
      internalOwner: 'someone',
      internalOwnerGroup: { id: 'g', displayName: 'G' },
      internalOwnerUser: { id: 'u', displayName: 'U' },
      entities: { edges: [], pageInfo: {}, totalCount: 0 },
    }
    const overrides: MergeFieldOverrides<typeof sample> = {
      description: { label: 'Description', type: 'longText' },
      assetType: { label: 'Asset type', type: 'enum' },
      sourceType: { label: 'Source type', type: 'enum' },
      cpe: { label: 'CPE', type: 'text' },
      containsPii: { label: 'Contains PII', type: 'boolean' },
    }
    const fields = buildMergeFields(sample, overrides, ['internalOwner', 'internalOwnerGroup', 'internalOwnerUser'])
    const keys = fields.map((f) => f.key)

    // Excluded by defaults
    expect(keys).not.toContain('id')
    expect(keys).not.toContain('__typename')
    expect(keys).not.toContain('createdAt')
    expect(keys).not.toContain('environmentName')
    expect(keys).not.toContain('scopeName')
    // Excluded by config
    expect(keys).not.toContain('internalOwner')
    expect(keys).not.toContain('internalOwnerGroup')
    expect(keys).not.toContain('internalOwnerUser')
    // Edges skipped
    expect(keys).not.toContain('entities')
    // User-facing scalars kept
    expect(keys).toEqual(
      expect.arrayContaining([
        'name',
        'displayName',
        'identifier',
        'description',
        'assetType',
        'sourceType',
        'accessModelName',
        'assetDataClassificationName',
        'criticalityName',
        'containsPii',
        'estimatedMonthlyCost',
        'purchaseDate',
        'tags',
        'categories',
      ]),
    )

    // Spot-check inferred types and labels
    const byKey = new Map(fields.map((f) => [f.key, f]))
    expect(byKey.get('cpe')).toEqual({ key: 'cpe', label: 'CPE', type: 'text' })
    expect(byKey.get('containsPii')).toEqual({ key: 'containsPii', label: 'Contains PII', type: 'boolean' })
    expect(byKey.get('estimatedMonthlyCost')?.type).toBe('number')
    expect(byKey.get('purchaseDate')?.type).toBe('date')
    expect(byKey.get('tags')?.type).toBe('tags')
    expect(byKey.get('description')).toEqual({ key: 'description', label: 'Description', type: 'longText' })
  })

  it('produces the expected field list for a Personnel-like record', () => {
    const sample = {
      id: '1',
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      displayID: 'P-1',
      environmentID: '',
      environmentName: '',
      scopeID: '',
      scopeName: '',
      isOpenlaneUser: false,
      avatarRemoteURL: 'https://x',
      fullName: 'Alice',
      email: 'a@b.com',
      emailAliases: ['x@y'],
      identityHolderType: 'EMPLOYEE',
      status: 'ACTIVE',
      isActive: true,
      department: 'Eng',
      team: 'Core',
      title: 'Engineer',
      location: 'EU',
      phoneNumber: null,
      startDate: '2026-01-01',
      endDate: null,
      externalReferenceID: 'ext-1',
      externalUserID: 'u-1',
      tags: ['t1'],
      metadata: { hr: 'foo' },
      userID: 'u',
      employerEntityID: 'e',
      hasPendingWorkflow: false,
      hasWorkflowHistory: false,
      workflowEligibleMarker: null,
      internalOwner: '',
      internalOwnerGroup: null,
      internalOwnerUser: null,
    }
    const overrides: MergeFieldOverrides<typeof sample> = {
      identityHolderType: { label: 'Type', type: 'enum' },
      status: { label: 'Status', type: 'enum' },
      isActive: { label: 'Active', type: 'boolean' },
      externalReferenceID: { label: 'External reference ID', type: 'text' },
      externalUserID: { label: 'External user ID', type: 'text' },
    }
    const exclude = [
      'internalOwner',
      'internalOwnerGroup',
      'internalOwnerUser',
      'userID',
      'employerEntityID',
      'hasPendingWorkflow',
      'hasWorkflowHistory',
      'workflowEligibleMarker',
      'avatarRemoteURL',
    ] as const
    const fields = buildMergeFields(sample, overrides, exclude)
    const keys = fields.map((f) => f.key)

    expect(keys).toEqual([
      'fullName',
      'email',
      'emailAliases',
      'identityHolderType',
      'status',
      'isActive',
      'department',
      'team',
      'title',
      'location',
      'phoneNumber',
      'startDate',
      'endDate',
      'externalReferenceID',
      'externalUserID',
      'tags',
      'metadata',
    ])

    const byKey = new Map(fields.map((f) => [f.key, f]))
    expect(byKey.get('email')?.type).toBe('text')
    expect(byKey.get('emailAliases')?.type).toBe('tags')
    expect(byKey.get('startDate')?.type).toBe('date')
    expect(byKey.get('metadata')?.type).toBe('map')
    expect(byKey.get('isActive')?.label).toBe('Active')
  })

  it('produces the expected field list for a Contact-like record', () => {
    const sample = {
      id: '1',
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      address: 'street',
      company: 'co',
      email: 'a@b',
      fullName: 'A',
      phoneNumber: '1',
      status: 'ACTIVE',
      tags: ['t'],
      title: 'CEO',
    }
    const overrides: MergeFieldOverrides<typeof sample> = {
      address: { label: 'Address', type: 'longText' },
      status: { label: 'Status', type: 'enum' },
    }
    const fields = buildMergeFields(sample, overrides)
    expect(fields.map((f) => f.key)).toEqual(['address', 'company', 'email', 'fullName', 'phoneNumber', 'status', 'tags', 'title'])
    const byKey = new Map(fields.map((f) => [f.key, f]))
    expect(byKey.get('address')?.type).toBe('longText')
    expect(byKey.get('status')?.type).toBe('enum')
    expect(byKey.get('phoneNumber')?.label).toBe('Phone number')
    expect(byKey.get('fullName')?.label).toBe('Full name')
  })

  it('produces the expected field list for a Vendor-like record', () => {
    const sample = {
      id: '1',
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      environmentID: '',
      environmentName: '',
      scopeID: '',
      scopeName: '',
      systemOwned: false,
      name: 'V',
      displayName: 'Vendor',
      description: 'desc',
      status: 'ACTIVE',
      annualSpend: 100,
      billingModel: 'monthly',
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      domains: ['x.com'],
      mfaEnforced: true,
      mfaSupported: true,
      hasSoc2: true,
      ssoEnforced: false,
      tags: ['t'],
      vendorMetadata: { foo: 'bar' },
      lastReviewedAt: '2026-01-01',
      nextReviewAt: '2026-02-01',
      // refs / objects we should exclude
      logoFile: { base64: 'x' },
      logoFileID: 'lf',
      entityTypeID: 'et',
      entityRelationshipStateID: 'er',
      entitySecurityQuestionnaireStatusID: 'es',
      entitySourceTypeID: 'es2',
      internalOwner: '',
      internalOwnerGroup: null,
      internalOwnerUser: null,
      reviewedBy: '',
      reviewedByGroup: null,
      reviewedByUser: null,
      // edge connection
      integrations: { edges: [] },
    }
    const overrides: MergeFieldOverrides<typeof sample> = {
      description: { label: 'Description', type: 'longText' },
      status: { label: 'Status', type: 'enum' },
      contractStartDate: { label: 'Contract start', type: 'date' },
      contractEndDate: { label: 'Contract end', type: 'date' },
      mfaEnforced: { label: 'MFA enforced', type: 'boolean' },
      mfaSupported: { label: 'MFA supported', type: 'boolean' },
      hasSoc2: { label: 'Has SOC2', type: 'boolean' },
      ssoEnforced: { label: 'SSO enforced', type: 'boolean' },
      vendorMetadata: { label: 'Vendor metadata', type: 'map' },
    }
    const exclude = [
      'internalOwner',
      'internalOwnerGroup',
      'internalOwnerUser',
      'reviewedBy',
      'reviewedByGroup',
      'reviewedByUser',
      'logoFile',
      'logoFileID',
      'entityTypeID',
      'entityRelationshipStateID',
      'entitySecurityQuestionnaireStatusID',
      'entitySourceTypeID',
    ] as const
    const fields = buildMergeFields(sample, overrides, exclude)
    const keys = fields.map((f) => f.key)

    expect(keys).toEqual([
      'name',
      'displayName',
      'description',
      'status',
      'annualSpend',
      'billingModel',
      'contractStartDate',
      'contractEndDate',
      'domains',
      'mfaEnforced',
      'mfaSupported',
      'hasSoc2',
      'ssoEnforced',
      'tags',
      'vendorMetadata',
      'lastReviewedAt',
      'nextReviewAt',
    ])

    const byKey = new Map(fields.map((f) => [f.key, f]))
    expect(byKey.get('hasSoc2')).toEqual({ key: 'hasSoc2', label: 'Has SOC2', type: 'boolean' })
    expect(byKey.get('mfaEnforced')).toEqual({ key: 'mfaEnforced', label: 'MFA enforced', type: 'boolean' })
    expect(byKey.get('annualSpend')?.type).toBe('number')
    expect(byKey.get('lastReviewedAt')?.type).toBe('date')
    expect(byKey.get('vendorMetadata')?.type).toBe('map')
    expect(byKey.get('domains')?.type).toBe('tags')
  })
})
