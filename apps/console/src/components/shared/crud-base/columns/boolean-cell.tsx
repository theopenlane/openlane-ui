type BooleanCellProps = {
  value: boolean | null | undefined
  trueLabel?: string
  falseLabel?: string
}

export function BooleanCell({ value, trueLabel = 'Yes', falseLabel = 'No' }: BooleanCellProps) {
  return <>{value ? trueLabel : falseLabel}</>
}
