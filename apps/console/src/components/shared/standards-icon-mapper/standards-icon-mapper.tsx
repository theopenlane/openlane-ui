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
import Pci from '@/assets/Pci'
import Nist800171 from '@/assets/Nist800171'

type TStandardsIconMapperProps = {
  shortName: string
  height?: number
  width?: number
}

export const StandardsIconMapper = ({ shortName, height, width }: TStandardsIconMapperProps) => {
  const icon = useMemo(() => {
    const sizeProps = { height, width }
    const iconMap: Record<string, React.ReactNode> = {
      'ISO 27001': <Iso27001 {...sizeProps} />,
      'NIST 800-53': <Nist80053 {...sizeProps} />,
      'NIST CSF': <NistCsf {...sizeProps} />,
      'SOC 2': <Soc2 {...sizeProps} />,
      'NIST SSDF': <NistSsdf {...sizeProps} />,
      GDPR: <Gdpr {...sizeProps} />,
      'CIS Benchmarks': <Cis {...sizeProps} />,
      CCM: <Ccm {...sizeProps} />,
      HIPAA: <Hipaa {...sizeProps} />,
      SOX: <Sox {...sizeProps} />,
      'PCI DSS': <Pci {...sizeProps} />,
      'NIST 800-171': <Nist800171 {...sizeProps} />,
    }
    return iconMap[shortName] || <Custom {...sizeProps} />
  }, [shortName, width, height])
  return <>{icon}</>
}
