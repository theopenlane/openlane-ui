import { getVendorSearchState } from './vendor-search-state'

describe('getVendorSearchState', () => {
  it('is idle when a cleared search leaves placeholder data behind', () => {
    expect(getVendorSearchState({ searchText: '', isSearchSettled: true, isLoading: false, isPlaceholderData: true, isError: false })).toEqual({ canShowResults: false, isPending: false })
  })

  it.each([
    { isSearchSettled: false, isLoading: false, isPlaceholderData: false, isError: false },
    { isSearchSettled: true, isLoading: true, isPlaceholderData: false, isError: false },
    { isSearchSettled: true, isLoading: false, isPlaceholderData: true, isError: false },
  ])('remains pending while an active search is not ready', (queryState) => {
    expect(getVendorSearchState({ searchText: 'acme', ...queryState })).toEqual({ canShowResults: false, isPending: true })
  })

  it('shows results when the active search is ready', () => {
    expect(getVendorSearchState({ searchText: 'acme', isSearchSettled: true, isLoading: false, isPlaceholderData: false, isError: false })).toEqual({ canShowResults: true, isPending: false })
  })

  it('stops pending and hides results when the search fails', () => {
    expect(getVendorSearchState({ searchText: 'acme', isSearchSettled: true, isLoading: false, isPlaceholderData: false, isError: true })).toEqual({ canShowResults: false, isPending: false })
  })
})
