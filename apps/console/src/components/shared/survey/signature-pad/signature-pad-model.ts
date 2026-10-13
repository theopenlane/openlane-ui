import { Serializer, type Base } from 'survey-core'
import { SIGNATURE_INK_COLOR, SIGNATURE_PAD_QUESTION_TYPE } from './signature-pad-type'
import './signature-pad.css'

const OPAQUE_DATA_FORMAT = 'jpeg'
const TRANSPARENT_DATA_FORMAT = 'png'

const penColor = Serializer.findProperty(SIGNATURE_PAD_QUESTION_TYPE, 'penColor')
if (penColor) penColor.defaultValue = SIGNATURE_INK_COLOR

const dataFormat = Serializer.findProperty(SIGNATURE_PAD_QUESTION_TYPE, 'dataFormat')
if (dataFormat) {
  const normalizeDataFormat = dataFormat.onSettingValue
  const toTransparentDataFormat = (pad: Base, value: string): string => {
    const normalized = normalizeDataFormat ? normalizeDataFormat(pad, value) : value
    return normalized === OPAQUE_DATA_FORMAT ? TRANSPARENT_DATA_FORMAT : normalized
  }
  dataFormat.onSettingValue = toTransparentDataFormat
  dataFormat.onSetValue = (pad: Base, value: string) => pad.setPropertyValue(dataFormat.name, toTransparentDataFormat(pad, value))
  dataFormat.setChoices(dataFormat.choices.filter((choice) => choice.value !== OPAQUE_DATA_FORMAT))
}
