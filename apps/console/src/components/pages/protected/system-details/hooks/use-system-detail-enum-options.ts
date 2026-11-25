'use client'

import { useMemo } from 'react'
import { SystemDetailSystemSensitivityLevel } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { usePlatformOptions } from '@/lib/graphql-hooks/platform'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

const SENSITIVITY_LEVEL_OPTIONS = enumToOptions(SystemDetailSystemSensitivityLevel)

export const useSystemDetailEnumOptions = () => {
  const { options } = usePlatformOptions()
  const platformIDsOptions = useMemo(() => options.map(({ id, name }) => ({ value: id, label: name })), [options])
  const { programOptions, hasProgramAccess } = useProgramSelect()
  const { tagOptions } = useGetTags()

  return {
    enumOpts: { sensitivityLevelOptions: SENSITIVITY_LEVEL_OPTIONS, tagOptions, platformIDsOptions, programIDsOptions: programOptions },
    hasProgramAccess,
  }
}
