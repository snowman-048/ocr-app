'use client'

import { useEffect, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { TOcrResponse } from '@/api/ocr/types'
import { DynamicDataTable } from '@/components/dynamic-data-table'
import { FileUploadStep, TFileUploadFormValues } from '@/components/file-upload-step'

enum EStep {
  FILE_UPLOAD = 'file-upload',
  DYNAMIC_DATA_TABLE = 'dynamic-data-table',
}

const STEP_QUERY_KEY = 'step'

const MainPage = () => {
  const [ocrResponse, setOcrResponse] = useState<TOcrResponse | null>(null)
  const [fileUploadValues, setFileUploadValues] = useState<TFileUploadFormValues | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const step = searchParams.get(STEP_QUERY_KEY) || EStep.FILE_UPLOAD

  const setStep = (step: EStep) => {
    router.push(`${pathname}?step=${step}`)
  }

  useEffect(() => {
    if (step !== EStep.FILE_UPLOAD && !ocrResponse) {
      setStep(EStep.FILE_UPLOAD)
    }
  }, [router, step])

  console.log('ocrResponse', ocrResponse)

  return (
    <div className="flex items-center justify-center w-full h-full overflow-hidden p-4">
      {step === EStep.FILE_UPLOAD && (
        <FileUploadStep
          defaultValues={fileUploadValues}
          onUploadComplete={(data, values) => {
            setOcrResponse(data)
            setFileUploadValues(values)
            setStep(EStep.DYNAMIC_DATA_TABLE)
          }}
        />
      )}
      {step === EStep.DYNAMIC_DATA_TABLE && !!ocrResponse && (
        <DynamicDataTable
          initialData={ocrResponse.records}
          templateType={ocrResponse.templateType}
          onGoBack={() => setStep(EStep.FILE_UPLOAD)}
          onGoNext={(data) => {
            console.log('data', data)
          }}
        />
      )}
    </div>
  )
}

export default MainPage
