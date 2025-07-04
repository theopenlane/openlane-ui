export type SelectedItem = {
  id: string
  name: string
  source: string | undefined
}

export type TSharedImportControlsComponentsProps = {
  selectedItems: SelectedItem[]
  setSelectedItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>
}
