import { isExternalReferenceExt, isExternalReferenceFilename, isPdfExt, isPdfFilename, isWordExt, isWordFilename } from './policy-management-utils'

describe('policy management file type checks', () => {
  test.each([
    { ext: 'docx', word: true, pdf: false },
    { ext: '.DOC', word: true, pdf: false },
    { ext: 'pdf', word: false, pdf: true },
    { ext: '.PDF', word: false, pdf: true },
    { ext: 'md', word: false, pdf: false },
    { ext: 'pdfx', word: false, pdf: false },
    { ext: '', word: false, pdf: false },
    { ext: null, word: false, pdf: false },
    { ext: undefined, word: false, pdf: false },
  ])('extension $ext', ({ ext, word, pdf }) => {
    expect(isWordExt(ext)).toBe(word)
    expect(isPdfExt(ext)).toBe(pdf)
    expect(isExternalReferenceExt(ext)).toBe(word || pdf)
  })

  test.each([
    { name: 'policy.docx', word: true, pdf: false },
    { name: 'Policy.Final.DOC', word: true, pdf: false },
    { name: 'policy.pdf', word: false, pdf: true },
    { name: 'Policy.PDF', word: false, pdf: true },
    { name: 'archive.pdf.zip', word: false, pdf: false },
    { name: 'policy.md', word: false, pdf: false },
    { name: 'pdf', word: false, pdf: false },
    { name: '', word: false, pdf: false },
    { name: null, word: false, pdf: false },
  ])('filename $name', ({ name, word, pdf }) => {
    expect(isWordFilename(name)).toBe(word)
    expect(isPdfFilename(name)).toBe(pdf)
    expect(isExternalReferenceFilename(name)).toBe(word || pdf)
  })
})
