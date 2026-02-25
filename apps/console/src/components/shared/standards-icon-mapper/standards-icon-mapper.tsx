import { useMemo } from 'react'
import Iso27001 from '@/assets/standards/iso27001'
import Iso27002 from '@/assets/standards/iso27002'
import Nist80053 from '@/assets/standards/nist80053'
import Nist800171 from '@/assets/standards/nist800171'
import NistCsf from '@/assets/standards/nistCsf'
import Soc2 from '@/assets/standards/soc2'
import Custom from '@/assets/standards/custom'
import Ccm from '@/assets/standards/ccm'
import Hipaa from '@/assets/standards/hipaa'
import Sox from '@/assets/standards/sox'
import PciDss from '@/assets/standards/pcidss'
import Masvs from '@/assets/standards/masvs'
import Asvs from '@/assets/standards/asvs'
import Ccpa from '@/assets/standards/ccpa'
import NercCip from '@/assets/standards/nerc-cip'
import FedrampHigh from '@/assets/standards/fedramp-high'
import FedrampModerate from '@/assets/standards/fredramp-moderate'
import Iso42001 from '@/assets/standards/iso42001'
import GDPR from '@/assets/standards/gdpr'

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
      'ISO 27002': <Iso27002 {...sizeProps} />,
      'ISO 42001': <Iso42001 {...sizeProps} />,
      'NIST 800-53': <Nist80053 {...sizeProps} />,
      'NIST 800-171': <Nist800171 {...sizeProps} />,
      'NIST CSF': <NistCsf {...sizeProps} />,
      'SOC 2': <Soc2 {...sizeProps} />,
      GDPR: <GDPR {...sizeProps} />,
      CCM: <Ccm {...sizeProps} />,
      HIPAA: <Hipaa {...sizeProps} />,
      SOX: <Sox {...sizeProps} />,
      'PCI DSS': <PciDss {...sizeProps} />,
      MASVS: <Masvs {...sizeProps} />,
      ASVS: <Asvs {...sizeProps} />,
      CCPA: <Ccpa {...sizeProps} />,
      'NERC CIP': <NercCip {...sizeProps} />,
      'FedRAMP High': <FedrampHigh {...sizeProps} />,
      'FedRAMP Moderate': <FedrampModerate {...sizeProps} />,
    }
    return iconMap[shortName] || <Custom {...sizeProps} />
  }, [shortName, width, height])
  return <>{icon}</>
}
