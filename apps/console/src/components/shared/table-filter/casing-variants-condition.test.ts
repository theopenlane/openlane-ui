import { getCasingVariantsCondition } from './casing-variants-condition'

describe('getCasingVariantsCondition', () => {
  test('ors the lowercase, sentence, title and upper casings of a lowercase tag', () => {
    expect(getCasingVariantsCondition('tagsHas', 'data privacy')).toEqual({
      or: [{ tagsHas: 'data privacy' }, { tagsHas: 'Data privacy' }, { tagsHas: 'Data Privacy' }, { tagsHas: 'DATA PRIVACY' }],
    })
  })

  test('dedupes variants that collapse for a single word', () => {
    expect(getCasingVariantsCondition('tagsHas', 'rp')).toEqual({ or: [{ tagsHas: 'rp' }, { tagsHas: 'Rp' }, { tagsHas: 'RP' }] })
  })

  test('always keeps the selected value verbatim, even when it is not lowercase', () => {
    expect(getCasingVariantsCondition('tagsHas', 'FedRAMP')).toEqual({
      or: [{ tagsHas: 'FedRAMP' }, { tagsHas: 'fedramp' }, { tagsHas: 'Fedramp' }, { tagsHas: 'FEDRAMP' }],
    })
  })

  test('emits a plain equality when the value has no casing variants', () => {
    expect(getCasingVariantsCondition('tagsHas', '2024')).toEqual({ tagsHas: '2024' })
  })

  test('title-cases after hyphen, underscore and slash boundaries', () => {
    expect(getCasingVariantsCondition('tagsHas', 'soc-2/type_ii')).toEqual({
      or: [{ tagsHas: 'soc-2/type_ii' }, { tagsHas: 'Soc-2/type_ii' }, { tagsHas: 'Soc-2/Type_Ii' }, { tagsHas: 'SOC-2/TYPE_II' }],
    })
  })
})
