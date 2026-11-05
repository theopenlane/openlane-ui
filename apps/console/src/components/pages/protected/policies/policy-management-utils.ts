const WORD_EXT = /^\.?docx?$/i
const PDF_EXT = /^\.?pdf$/i

const extensionOf = (name: string | undefined | null): string | null => {
  if (!name) return null
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1) : null
}

export const isWordExt = (ext: string | undefined | null): boolean => !!ext && WORD_EXT.test(ext)

export const isPdfExt = (ext: string | undefined | null): boolean => !!ext && PDF_EXT.test(ext)

export const isWordFilename = (name: string | undefined | null): boolean => isWordExt(extensionOf(name))

export const isPdfFilename = (name: string | undefined | null): boolean => isPdfExt(extensionOf(name))

// external reference documents are files managed outside Openlane and viewed in it: Word documents and PDFs
export const isExternalReferenceExt = (ext: string | undefined | null): boolean => isWordExt(ext) || isPdfExt(ext)

export const isExternalReferenceFilename = (name: string | undefined | null): boolean => isExternalReferenceExt(extensionOf(name))
