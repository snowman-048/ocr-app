import { NextRequest, NextResponse } from 'next/server'
import z from 'zod'

import { TOcrResponse } from '@/api/ocr/types'
import { processImage } from '@/helpers/process-image'
import { EOcrMethod } from '@/lib/ocr/enums'
import { processWithOpenAI } from '@/lib/ocr/openai-processor'
import { TTemplateRecord, TTemplateType, getOcrTemplate } from '@/lib/ocr/templates'

export const runtime = 'nodejs'
// export const maxDuration = 120;

const PROCESSORS_MAP = {
  [EOcrMethod.OPENAI]: processWithOpenAI,
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const method = formData.get('method') as EOcrMethod
    const templateType = formData.get('templateType') as TTemplateType

    const template = getOcrTemplate(templateType)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB' }, { status: 400 })
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG and PNG allowed' },
        { status: 400 },
      )
    }

    const processor = PROCESSORS_MAP[method]

    if (!processor) {
      return NextResponse.json({ error: 'Invalid OCR method' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const { base64, quality: imageQuality } = await processImage(buffer)

    const records = await processor({
      base64Image: base64,
      templateType: template.type as TTemplateType,
    })

    const validatedRecords = (
      template.schema ? z.array(template.schema).parse(records) : records
    ) as TTemplateRecord[]

    const response: TOcrResponse = {
      records: validatedRecords,
      processingTime: Date.now() - startTime,
      method,
      templateType,
      imageQuality,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('OCR API error:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
