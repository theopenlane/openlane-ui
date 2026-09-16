import { fileURLToPath } from 'node:url'
import { COMPLEXITY_LIMIT, scoreOperationsIn } from './operation-complexity'

const QUERY_DIRECTORIES = ['../query', '../query-history'].map((relative) => fileURLToPath(new URL(relative, import.meta.url)))

describe('graphql operation complexity', () => {
  const scored = QUERY_DIRECTORIES.flatMap((directory) => scoreOperationsIn(directory))

  it('parses every operation in the query directories', () => {
    expect(scored.length).toBeGreaterThan(0)
  })

  it(`keeps every operation at or below the server complexity limit of ${COMPLEXITY_LIMIT}`, () => {
    const offenders = scored.filter((operation) => operation.complexity > COMPLEXITY_LIMIT)
    const report = offenders.map((operation) => `${operation.complexity}  ${operation.name} (${operation.file})`).join('\n')

    expect(report).toBe('')
  })
})
