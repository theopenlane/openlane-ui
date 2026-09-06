import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type FilterOption } from '@/types'

export const getTagsFilterField = (options: FilterOption[]) =>
  ({
    key: 'tagsHas',
    label: 'Tags',
    type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Tag,
    options,
    matchAnyCasing: true,
  }) as const
