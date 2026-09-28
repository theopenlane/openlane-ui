import { countries } from 'country-data-list'

export type Country = (typeof countries.all)[number]

const EXCLUDED_IOC = 'PRK'

const rawList = countries.all.filter((country) => country.alpha3 && country.emoji && country.name && country.status !== 'deleted' && country.ioc !== EXCLUDED_IOC)

export const COUNTRY_LIST: Country[] = Array.from(new Map(rawList.map((country) => [country.alpha3, country])).values())

const DISPLAY_BY_ALPHA3 = new Map(countries.all.filter((country) => country.alpha3 && country.status !== 'deleted').map((country) => [country.alpha3, country]))

export const findCountryByAlpha3 = (alpha3: string): Country | undefined => DISPLAY_BY_ALPHA3.get(alpha3)

const CODE_PATTERN = /^[A-Za-z]{2,3}$/

const CODE_ALIASES: Record<string, string> = {
  UK: 'GBR',
  UAE: 'ARE',
}

const NAME_ALIASES: Record<string, string> = {
  england: 'GBR',
  scotland: 'GBR',
  wales: 'GBR',
  greatbritain: 'GBR',
  unitedstatesofamerica: 'USA',
  america: 'USA',
  southkorea: 'KOR',
  czechia: 'CZE',
  holland: 'NLD',
  thenetherlands: 'NLD',
  iran: 'IRN',
  turkey: 'TUR',
  turkiye: 'TUR',
  syria: 'SYR',
  laos: 'LAO',
  brunei: 'BRN',
  vatican: 'VAT',
  burma: 'MMR',
  capeverde: 'CPV',
  swaziland: 'SWZ',
  macedonia: 'MKD',
  ivorycoast: 'CIV',
}

const nameKey = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

const CODE_INDEX = new Map<string, string>()
const NAME_INDEX = new Map<string, string>()

const addOnce = (index: Map<string, string>, key: string, alpha3: string) => {
  if (key && !index.has(key)) index.set(key, alpha3)
}

COUNTRY_LIST.forEach((country) => {
  addOnce(CODE_INDEX, country.alpha3.toUpperCase(), country.alpha3)
  addOnce(CODE_INDEX, country.alpha2.toUpperCase(), country.alpha3)
  addOnce(NAME_INDEX, nameKey(country.name), country.alpha3)
})
COUNTRY_LIST.forEach((country) => addOnce(NAME_INDEX, nameKey(country.name.split(',')[0]), country.alpha3))
Object.entries(CODE_ALIASES).forEach(([code, alpha3]) => addOnce(CODE_INDEX, code, alpha3))
Object.entries(NAME_ALIASES).forEach(([name, alpha3]) => addOnce(NAME_INDEX, name, alpha3))

export const resolveCountryCode = (value: string): string | undefined => {
  const trimmed = value.trim()
  return CODE_PATTERN.test(trimmed) ? CODE_INDEX.get(trimmed.toUpperCase()) : NAME_INDEX.get(nameKey(trimmed))
}
