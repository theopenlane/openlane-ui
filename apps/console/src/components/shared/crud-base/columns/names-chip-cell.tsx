import { Badge } from '@repo/ui/badge'

type NamesChipCellProps = {
  names: (string | null | undefined)[] | null | undefined
}

export function NamesChipCell({ names }: NamesChipCellProps) {
  const values = names?.filter((name): name is string => !!name)

  if (!values?.length) {
    return <>-</>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((name, i) => (
        <Badge key={i} variant="outline" className="w-fit">
          {name}
        </Badge>
      ))}
    </div>
  )
}
