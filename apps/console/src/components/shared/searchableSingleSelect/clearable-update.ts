export const buildClearableUpdate = (fieldKey: string, value: string, clearKey: string): Record<string, string | boolean> => (value ? { [fieldKey]: value } : { [clearKey]: true })
