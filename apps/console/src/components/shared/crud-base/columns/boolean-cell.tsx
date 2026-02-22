// BooleanCellProps defines the props for BooleanCell
type BooleanCellProps = {
  value: boolean | null | undefined
  trueLabel?: string
  falseLabel?: string
}

// BooleanCell renders a human-readable label for a boolean value
export function BooleanCell({ value, trueLabel = 'Yes', falseLabel = 'No' }: BooleanCellProps) {
  return <>{value ? trueLabel : falseLabel}</>
}
