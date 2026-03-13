import { NextRequest, NextResponse } from 'next/server'
import z from 'zod'

import { TOcrResponse } from '@/api/ocr/types'
import { processImage } from '@/helpers/process-image'
import { logger } from '@/lib/logger'
import { EOcrMethod } from '@/lib/ocr/enums'
import { processWithOpenAI } from '@/lib/ocr/openai-processor'
import { TTemplateRecord, TTemplateType, getOcrTemplate } from '@/lib/ocr/templates'

const PROCESSORS_MAP = {
  [EOcrMethod.OPENAI]: processWithOpenAI,
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg']
const MAX_FILE_SIZE = 10 * 1024 * 1024

const formFieldsSchema = z.object({
  method: z.nativeEnum(EOcrMethod),
  templateType: z.enum(['freeform', 'patientLiquidBalance'] as [string, ...string[]]),
})

const POST = async (request: NextRequest) => {
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const rawMethod = formData.get('method') as string
    const rawTemplateType = formData.get('templateType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG and PNG allowed' },
        { status: 400 },
      )
    }

    const fieldValidation = formFieldsSchema.safeParse({
      method: rawMethod,
      templateType: rawTemplateType,
    })

    if (!fieldValidation.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      )
    }

    const { method, templateType } = fieldValidation.data as {
      method: EOcrMethod
      templateType: TTemplateType
    }

    const template = getOcrTemplate(templateType)
    const processor = PROCESSORS_MAP[method]

    if (!processor) {
      return NextResponse.json({ error: 'Invalid OCR method' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const { base64, quality: imageQuality } = await processImage(buffer)

    const processedData = await processor({
      base64Image: base64,
      templateType: template.type as TTemplateType,
      imageQuality,
    })

    const records = processedData.records

    const validatedRecords = (
      template.schema ? z.array(template.schema).parse(records) : records
    ) as TTemplateRecord[]

    const processingTime = Date.now() - startTime

    const response: TOcrResponse = {
      records: validatedRecords,
      processingTime,
      method,
      templateType,
      imageQuality,
      tokensConsumption: processedData.tokensConsumption,
    }

    logger.info({
      msg: 'OCR processing completed',
      method,
      templateType,
      imageQuality,
      processingTimeMs: processingTime,
      recordCount: validatedRecords.length,
      tokens: processedData.tokensConsumption,
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ msg: 'OCR API error', error })

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data validation failed' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Processing failed. Please try again.' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

export { POST }
