import type { Page, Locator } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** File-upload helpers + committed sample fixtures (e2e/fixtures/files/). */

const FILES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'files')

export const fixtureFile = (name: string): string => path.join(FILES_DIR, name)

export const SAMPLE_PDF = fixtureFile('sample.pdf')
export const SAMPLE_PNG = fixtureFile('sample.png')
export const SAMPLE_CSV = fixtureFile('sample.csv')
export const SAMPLE_DISALLOWED = fixtureFile('sample.exe')

/** Set files on a file input. */
export const uploadFiles = async (page: Page, files: string | string[], input?: Locator): Promise<void> => {
  const target = input ?? page.locator('input[type="file"]').first()
  await target.setInputFiles(files)
}

export const inlineCsv = (name: string, rows: string): { name: string; mimeType: string; buffer: Buffer } => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(rows, 'utf-8'),
})
