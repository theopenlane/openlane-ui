import { keepPreviousData, QueryClient, QueryObserver } from '@tanstack/react-query'
import { getVendorSearchState } from './vendor-select-field'

describe('getVendorSearchState', () => {
  it('is idle and hides results when a cleared search leaves placeholder data on a disabled query', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { placeholderData: keepPreviousData },
      },
    })
    const observer = new QueryObserver(queryClient, {
      queryKey: ['vendors', 'acme'],
      queryFn: async () => ['Acme'],
      enabled: true,
    })

    await observer.refetch()
    observer.setOptions({
      queryKey: ['vendors', ''],
      queryFn: async () => [],
      enabled: false,
    })

    const result = observer.getCurrentResult()
    expect(result.isPlaceholderData).toBe(true)
    expect(
      getVendorSearchState({
        searchText: '',
        isSearchSettled: true,
        isLoading: result.isLoading,
        isPlaceholderData: result.isPlaceholderData,
      }),
    ).toEqual({ canShowResults: false, isPending: false })
  })

  it.each([
    { isSearchSettled: false, isLoading: false, isPlaceholderData: false },
    { isSearchSettled: true, isLoading: true, isPlaceholderData: false },
    { isSearchSettled: true, isLoading: false, isPlaceholderData: true },
  ])('remains pending while an active search is not ready', (queryState) => {
    expect(getVendorSearchState({ searchText: 'acme', ...queryState })).toEqual({ canShowResults: false, isPending: true })
  })

  it('shows results when the active search is ready', () => {
    expect(getVendorSearchState({ searchText: 'acme', isSearchSettled: true, isLoading: false, isPlaceholderData: false })).toEqual({ canShowResults: true, isPending: false })
  })
})
