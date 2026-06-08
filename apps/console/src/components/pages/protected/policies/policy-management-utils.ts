const WORD_EXT = /^\.?docx?$/i

export const isWordExt = (ext: string | undefined | null): boolean => !!ext && WORD_EXT.test(ext)

export const isWordFilename = (name: string | undefined | null): boolean => {
  if (!name) return false
  const dot = name.lastIndexOf('.')
  return dot >= 0 && WORD_EXT.test(name.slice(dot + 1))
}
