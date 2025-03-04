import { useMemo } from 'react'

// Sorts an array of objects by a specified key by moving null values to the end
function sortEmptiesToEndByKey<T extends Record<string, any>>(arr: T[], key: keyof T): T[] {
  return arr.filter((item) => item[key]).concat(arr.filter((item) => !item[key]))
}

export function DocumentDescriptions({ descriptions }: { descriptions: { label: string; value?: string | null }[] }) {
  if (!descriptions) return null

  const descriptionsEmptyLast = useMemo(() => {
    return sortEmptiesToEndByKey(descriptions, 'value')
  }, [descriptions])

  return (
    <div className="flex flex-col divide-y divide-border mb-10">
      {descriptionsEmptyLast.map((desc) => (
        <div key={desc.label} className="flex flex-row py-5">
          <div className="w-40 min-w-40 font-bold">{desc.label}</div>
          <div>{desc.value || <span className="italic text-text-dimmed">None</span>}</div>
        </div>
      ))}
    </div>
  )
}
