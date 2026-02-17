'use client'

import { TOcrResponse } from '@/api/ocr/types'
import { TOcrTemplate, TTemplateRecord } from '@/lib/ocr/templates'

import { DynamicDataTable } from './dynamic-data-table'
import { ManageDataWrapper, TManageDataWrapperProps } from './manage-data-wrapper'

type TProps = Omit<TManageDataWrapperProps<TTemplateRecord[]>, 'children' | 'data'> & {
  data: TOcrResponse[]
  template: TOcrTemplate
}

const DataReviewStep = ({ data, template, onGoBack, onGoNext }: TProps) => {
  return (
    <ManageDataWrapper
      data={data.map((item) => item.records)}
      title={template.name}
      description={template.description}
      onGoBack={onGoBack}
      onGoNext={onGoNext}
    >
      {({ currentIndex, currentRecords, onDataChange }) => (
        <DynamicDataTable
          key={currentIndex}
          records={currentRecords}
          template={template}
          onDataChange={onDataChange}
        />
      )}
    </ManageDataWrapper>
  )
}

export { DataReviewStep }
