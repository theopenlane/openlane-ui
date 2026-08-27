interface VendorSearchStateInput {
  searchText: string
  isSearchSettled: boolean
  isLoading: boolean
  isPlaceholderData: boolean
  isError: boolean
}

export const getVendorSearchState = ({ searchText, isSearchSettled, isLoading, isPlaceholderData, isError }: VendorSearchStateInput) => {
  const hasSearch = searchText.trim().length > 0

  return {
    canShowResults: hasSearch && isSearchSettled && !isLoading && !isPlaceholderData && !isError,
    isPending: hasSearch && !isError && (isLoading || !isSearchSettled || isPlaceholderData),
  }
}
