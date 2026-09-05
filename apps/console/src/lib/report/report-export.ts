import { exportToCSV } from '@/utils/exportToCSV'
import { downloadFile } from '@/utils/downloadFile'
import { formatCell, type TReportRow } from './report-rows'
import type { TReportColumn } from './report-schema'

export type TReportExportFormat = 'csv' | 'json' | 'yaml'

export const EXPORT_FORMATS: readonly TReportExportFormat[] = ['csv', 'json', 'yaml']

export const EXPORT_FORMAT_LABELS: Record<TReportExportFormat, string> = {
  csv: 'CSV',
  json: 'JSON',
  yaml: 'YAML',
}

const SAFE_YAML_KEY = /^[A-Za-z_][A-Za-z0-9_.-]*$/

const YAML_UNPRINTABLE = /[\u007F-\u009F\u2028\u2029]/g

const ENTRY_INDENT = '  '
const SEQUENCE_INDENT = '    '

const escapeYaml = (json: string): string => json.replace(YAML_UNPRINTABLE, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`)

const yamlString = (value: string): string => escapeYaml(JSON.stringify(value))

const yamlKey = (key: string): string => (SAFE_YAML_KEY.test(key) ? key : yamlString(key))

const yamlScalar = (value: unknown): string => {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') return yamlString(JSON.stringify(value))

  return yamlString(String(value))
}

const yamlEntry = (key: string, value: unknown, isFirst: boolean): string[] => {
  const prefix = isFirst ? '- ' : ENTRY_INDENT

  if (!Array.isArray(value)) return [`${prefix}${yamlKey(key)}: ${yamlScalar(value)}`]
  if (value.length === 0) return [`${prefix}${yamlKey(key)}: []`]

  return [`${prefix}${yamlKey(key)}:`, ...value.map((item) => `${SEQUENCE_INDENT}- ${yamlScalar(item)}`)]
}

export const toYaml = (rows: TReportRow[], columns: TReportColumn[]): string => {
  if (rows.length === 0) return '[]\n'

  const documents = rows.map((row) => columns.flatMap((column, index) => yamlEntry(column.path, row[column.path], index === 0)).join('\n'))

  return `${documents.join('\n')}\n`
}

export const toJson = (rows: TReportRow[], columns: TReportColumn[]): string =>
  JSON.stringify(
    rows.map((row) => Object.fromEntries(columns.map((column) => [column.path, row[column.path] ?? null]))),
    null,
    2,
  )

export const exportReport = (format: TReportExportFormat, rows: TReportRow[], columns: TReportColumn[], fileName: string) => {
  if (format === 'csv') {
    exportToCSV(
      rows,
      columns.map((column) => ({ label: column.label, accessor: (row: TReportRow) => formatCell(row[column.path], column.field.kind) })),
      fileName,
    )
    return
  }

  if (format === 'json') {
    downloadFile([toJson(rows, columns)], `${fileName}.json`, 'application/json;charset=utf-8')
    return
  }

  downloadFile([toYaml(rows, columns)], `${fileName}.yaml`, 'application/yaml;charset=utf-8')
}
