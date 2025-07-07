export type SelectedItem = {
  id: string
  name: string
  source: string | undefined
}

export type TSharedImportControlsComponentsPropsBase = {
  selectedItems: SelectedItem[]
  setSelectedItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>
}

export type TSharedImportControlsComponentsPropsFrameworks = TSharedImportControlsComponentsPropsBase & {
  selectedFrameworkIds: string[]
  setSelectedFrameworkIds: React.Dispatch<React.SetStateAction<string[]>>
}

export type TSharedImportControlsComponentsPropsPrograms = TSharedImportControlsComponentsPropsBase & {
  selectedProgramIds: string[]
  setSelectedProgramIds: React.Dispatch<React.SetStateAction<string[]>>
}
