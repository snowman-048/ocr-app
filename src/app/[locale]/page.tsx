'use client'

import { useEffect, useMemo, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { TOcrResponse } from '@/api/ocr/types'
import { DataReviewStep } from '@/components/data-review-step'
import { ExportStep } from '@/components/export-step'
import { FileUploadStep, TFileUploadFormValues } from '@/components/file-upload-step'
import { FormatMethodStep } from '@/components/format-method-step'
import { getOcrTemplate } from '@/lib/ocr/templates'

enum EStep {
  FILE_UPLOAD = 'file-upload',
  DYNAMIC_DATA_TABLE = 'dynamic-data-table',
  FORMAT_METHOD = 'format-method',
  EXPORT = 'export',
}

const STEP_QUERY_KEY = 'step'

const MainPage = () => {
  const [fileUploadValues, setFileUploadValues] = useState<TFileUploadFormValues | null>(null)
  const [currentOcrData, setCurentOcrData] = useState<TOcrResponse[] | null>(null)
  const [formatMethodId, setFormatMethodId] = useState<string | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const step = searchParams.get(STEP_QUERY_KEY) || EStep.FILE_UPLOAD

  const template = useMemo(() => getOcrTemplate(fileUploadValues?.templateType), [fileUploadValues])
  const isSingleExportFormat = useMemo(() => template.exportVariants.length === 1, [template])

  const setStep = (step: EStep) => {
    router.push(`${pathname}?step=${step}`)
  }

  useEffect(() => {
    if (step !== EStep.FILE_UPLOAD && !currentOcrData) {
      setStep(EStep.FILE_UPLOAD)
    }
  }, [router, step])

  return (
    <div className="flex items-center justify-center w-full h-full overflow-hidden p-4">
      {step === EStep.FILE_UPLOAD && (
        <FileUploadStep
          defaultValues={fileUploadValues}
          onUploadComplete={(data, values) => {
            setCurentOcrData(data)
            setFileUploadValues(values)
            setStep(EStep.DYNAMIC_DATA_TABLE)
          }}
        />
      )}
      {step === EStep.DYNAMIC_DATA_TABLE && !!currentOcrData?.length && (
        <DataReviewStep
          data={currentOcrData}
          template={template}
          onGoBack={() => {
            setStep(EStep.FILE_UPLOAD)
            setCurentOcrData(null)
          }}
          onGoNext={(newData) => {
            const formatted = [...currentOcrData].map((item, index) => ({
              ...item,
              records: newData[index],
            }))
            setCurentOcrData(formatted)
            if (isSingleExportFormat) {
              setFormatMethodId(template.exportVariants[0].id)
              setStep(EStep.EXPORT)
            } else {
              setStep(EStep.FORMAT_METHOD)
            }
          }}
        />
      )}
      {step === EStep.FORMAT_METHOD && (
        <FormatMethodStep
          template={template}
          defaultValue={formatMethodId}
          onGoBack={() => setStep(EStep.DYNAMIC_DATA_TABLE)}
          onGoNext={(id) => {
            setFormatMethodId(id)
            setStep(EStep.EXPORT)
          }}
        />
      )}
      {step === EStep.EXPORT && !!formatMethodId && !!currentOcrData?.length && (
        <ExportStep
          data={currentOcrData}
          template={template}
          formatMethodId={formatMethodId}
          onGoBack={() => {
            if (isSingleExportFormat) {
              setStep(EStep.DYNAMIC_DATA_TABLE)
            } else {
              setStep(EStep.FORMAT_METHOD)
            }
          }}
          onGoNext={() => {
            setFileUploadValues((prev) => (prev ? { ...prev, files: [] } : null))
            setCurentOcrData(null)
            setFormatMethodId(null)
            setStep(EStep.FILE_UPLOAD)
          }}
        />
      )}
    </div>
  )
}

export default MainPage
