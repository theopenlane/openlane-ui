const naturalCollator = new Intl.Collator('en', { numeric: true })

export const compareNatural = (a: string, b: string): number => naturalCollator.compare(a, b)

export const compareByCreatedAt = (a: { createdAt: string }, b: { createdAt: string }): number => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0)
