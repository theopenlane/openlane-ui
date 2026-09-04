import { buildCreateEvidenceInput, toIsoDate, type BuildCreateEvidenceInputArgs } from './build-evidence-input'
import { type CreateEvidenceFormData } from './use-form-schema'

const formData = (overrides: Partial<CreateEvidenceFormData> = {}): CreateEvidenceFormData =>
  ({
    name: 'Quarterly access review',
    ...overrides,
  }) as CreateEvidenceFormData

const build = (args: Partial<BuildCreateEvidenceInputArgs> = {}) => buildCreateEvidenceInput({ data: formData(), ...args })

describe('toIsoDate', () => {
  it('serialises a Date to an ISO string', () => {
    expect(toIsoDate(new Date('2026-03-04T05:06:07.000Z'))).toBe('2026-03-04T05:06:07.000Z')
  })

  it('passes an already-serialised string through untouched', () => {
    expect(toIsoDate('2026-03-04')).toBe('2026-03-04')
  })

  it('maps null and undefined onto undefined so the field is omitted', () => {
    expect(toIsoDate(null)).toBeUndefined()
    expect(toIsoDate(undefined)).toBeUndefined()
  })
})

describe('buildCreateEvidenceInput', () => {
  it('carries the plain fields through', () => {
    const input = build({ data: formData({ name: 'Pen test report', description: 'annual', source: 'vendor', tags: ['security'] }) })

    expect(input.name).toBe('Pen test report')
    expect(input.description).toBe('annual')
    expect(input.source).toBe('vendor')
    expect(input.tags).toEqual(['security'])
  })

  it('serialises both date fields', () => {
    const input = build({
      data: formData({ creationDate: new Date('2026-01-02T00:00:00.000Z'), renewalDate: new Date('2027-01-02T00:00:00.000Z') }),
    })

    expect(input.creationDate).toBe('2026-01-02T00:00:00.000Z')
    expect(input.renewalDate).toBe('2027-01-02T00:00:00.000Z')
  })

  it('omits status entirely when none is supplied, so the backend keeps its own', () => {
    expect('status' in build()).toBe(false)
  })

  it('includes status when one is supplied', () => {
    const input = build({ status: 'APPROVED' as BuildCreateEvidenceInputArgs['status'] })

    expect(input.status).toBe('APPROVED')
  })

  it('omits url and reviewFrequency when they are empty rather than sending empty values', () => {
    const input = build({ data: formData({ url: '', reviewFrequency: undefined }) })

    expect('url' in input).toBe(false)
    expect('reviewFrequency' in input).toBe(false)
  })

  it('includes url and reviewFrequency when they are set', () => {
    const input = build({ data: formData({ url: 'https://example.com/report.pdf', reviewFrequency: 'YEARLY' as CreateEvidenceFormData['reviewFrequency'] }) })

    expect(input.url).toBe('https://example.com/report.pdf')
    expect(input.reviewFrequency).toBe('YEARLY')
  })

  it('keeps both an explicit programId and the form values', () => {
    const input = build({ data: formData({ programIDs: ['form-program'] }), programId: 'sheet-program' })

    expect(input.programIDs).toEqual(['sheet-program', 'form-program'])
  })

  it('falls back to the form programIDs when no programId is supplied', () => {
    const input = build({ data: formData({ programIDs: ['form-program'] }) })

    expect(input.programIDs).toEqual(['form-program'])
  })

  it('defaults programIDs to an empty array when neither source has one', () => {
    expect(build().programIDs).toEqual([])
  })

  it('spreads object associations into the input', () => {
    const input = build({ objectAssociations: { taskIDs: ['task-1'], programIDs: ['program-1'] } })

    expect(input.taskIDs).toEqual(['task-1'])
  })

  it('lets the form control and subcontrol ids win over the association map', () => {
    const input = build({
      data: formData({ controlIDs: ['form-control'], subcontrolIDs: ['form-subcontrol'] }),
      objectAssociations: { controlIDs: ['assoc-control'], subcontrolIDs: ['assoc-subcontrol'] },
    })

    expect(input.controlIDs).toEqual(['form-control'])
    expect(input.subcontrolIDs).toEqual(['form-subcontrol'])
  })

  it('passes a converted collectionProcedure through', () => {
    const input = build({ collectionProcedure: '<p>run the export</p>' })

    expect(input.collectionProcedure).toBe('<p>run the export</p>')
  })
})
