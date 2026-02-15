import { EImageQuality } from '@/enums/image-quality'
import { EOcrMethod } from '@/lib/ocr/enums'
import { TTemplateRecord, TTemplateType } from '@/lib/ocr/templates'
import { TOcrAiConsumption } from '@/lib/ocr/types'

type TOcrResponse = {
  records: TTemplateRecord[]
  processingTime: number
  method: EOcrMethod
  templateType: TTemplateType
  imageQuality: EImageQuality
  tokensConsumption?: TOcrAiConsumption
}

export type { TOcrResponse }
