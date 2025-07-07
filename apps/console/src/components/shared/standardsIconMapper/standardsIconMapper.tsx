import { useMemo } from 'react'
import Iso27001 from '@/assets/Iso27001'
import Nist80053 from '@/assets/Nist800-53'
import NistCsf from '@/assets/NistCsf'
import Soc2 from '@/assets/Soc2'
import Custom from '@/assets/Custom'
import NistSsdf from '@/assets/NistSsdf'
import Cis from '@/assets/Cis'
import Gdpr from '@/assets/Gdpr'
import Ccm from '@/assets/Ccm'
import Hipaa from '@/assets/Hipaa'
import Sox from '@/assets/Sox'

type StandardsIconMapperProps = {
  shortName: string
}

export const StandardsIconMapper = ({ shortName }: StandardsIconMapperProps) => {
  const icon = useMemo(() => {
    const iconMap: Record<string, React.ReactNode> = {
      'ISO 27001': <Iso27001 />,
      'NIST 800-53': <Nist80053 />,
      'NIST CSF': <NistCsf />,
      'SOC 2': <Soc2 />,
      'NIST SSDF': <NistSsdf />,
      GDPR: <Gdpr />,
      'CIS Benchmarks': <Cis />,
      CCM: <Ccm />,
      HIPPA: <Hipaa />,
      SOX: <Sox />,
    }
    return iconMap[shortName] || <Custom />
  }, [shortName])
  return <>{icon}</>
}
