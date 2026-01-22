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
import Iso27002 from '@/assets/Iso27002'
import MASVS from '@/assets/Masvs'
import Asvs from '@/assets/Asvs'
import Ccpa from '@/assets/Ccpa'
import Nerc from '@/assets/Nerc'
import Cobit from '@/assets/Cobit'
import FedRAMPHigh from '@/assets/FedRAMPHigh'
import FedRAMPModerate from '@/assets/FedRAMPModerate'
import FedRAMPLow from '@/assets/FedRAMPLow'

type TStandardsIconMapperProps = {
  shortName: string | undefined | null
  height?: number
  width?: number
}

const StandardsIconMapper = ({ shortName, height, width }: TStandardsIconMapperProps) => {
  const icon = useMemo(() => {
    const sizeProps = { height, width }
    const iconMap: Record<string, React.ReactNode> = {
      'ISO 27001': <Iso27001 {...sizeProps} />,
      'ISO 27002': <Iso27002 {...sizeProps} />,
      'NIST 800-53': <Nist80053 {...sizeProps} />,
      'NIST 800-171': <Nist800171 {...sizeProps} />,
      'NIST CSF': <NistCsf {...sizeProps} />,
      'SOC 2': <Soc2 {...sizeProps} />,
      'NIST SSDF': <NistSsdf {...sizeProps} />,
      GDPR: <Gdpr {...sizeProps} />,
      'CIS Benchmarks': <Cis {...sizeProps} />,
      CCM: <Ccm {...sizeProps} />,
      HIPAA: <Hipaa {...sizeProps} />,
      SOX: <Sox {...sizeProps} />,
      'PCI DSS': <Pci {...sizeProps} />,
      MASVS: <MASVS {...sizeProps} />,
      ASVS: <Asvs {...sizeProps} />,
      CCPA: <Ccpa {...sizeProps} />,
      'NERC CIP': <Nerc {...sizeProps} />,
      COBIT: <Cobit {...sizeProps} />,
      'FedRAMP High': <FedRAMPHigh {...sizeProps} />,
      'FedRAMP Moderate': <FedRAMPModerate {...sizeProps} />,
      'FedRAMP Low': <FedRAMPLow {...sizeProps} />,
    }
    return iconMap[shortName || ''] || <Custom {...sizeProps} />
  }, [shortName, width, height])
  return <>{icon}</>
}

interface TStandardIconProps {
  shortName: string | null | undefined
  base64: string | null | undefined
  governingBodyLogoURL: string | null | undefined
  height?: number
  width?: number
}

export const StandardIcon = ({ shortName, base64, governingBodyLogoURL, height = 24, width = 24 }: TStandardIconProps) => {
  const sizeStyles = { height, width }

  if (base64) {
    const src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`${shortName} logo`} style={sizeStyles} />
    )
  }

  if (governingBodyLogoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={governingBodyLogoURL} alt={`${shortName} governing body logo`} style={sizeStyles} />
    )
  }

  return <StandardsIconMapper shortName={shortName} height={height} width={width} />
}
