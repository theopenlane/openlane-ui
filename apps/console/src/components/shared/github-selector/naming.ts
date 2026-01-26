export const formatFileName = (name: string): string => {
  // Remove file extension
  const nameWithoutExt = name.replace(/\.(md|txt|mdx|doc|docx)$/i, '')

  // Replace hyphens and underscores with spaces, then convert to Title Case
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
