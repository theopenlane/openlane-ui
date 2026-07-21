// The dashboard's compact suggestion card has no room for a multi-paragraph markdown body, and
// showing the raw markdown there would leak syntax (links, bullets, bold markers) into a
// single-line preview. Suggestions are authored with a plain-text first line for exactly this,
// so the card can just show that line while the full markdown renders in the detail sheet.
export const firstLineOf = (text: string): string => text.split('\n')[0].trim()
