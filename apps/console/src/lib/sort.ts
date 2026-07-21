const naturalCollator = new Intl.Collator('en', { numeric: true })

export const compareNatural = (a: string, b: string): number => naturalCollator.compare(a, b)
