export const matchesSearch = (name: string, label: string, search: string): boolean => {
  const term = search.trim().toLowerCase()

  return term === '' || name.toLowerCase().includes(term) || label.toLowerCase().includes(term)
}
