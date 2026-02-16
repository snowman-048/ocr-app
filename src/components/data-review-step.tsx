'use client'

import { DynamicDataTable } from './dynamic-data-table'
import { ManageDataWrapper, TManageDataWrapperProps } from './manage-data-wrapper'

type TProps = Omit<TManageDataWrapperProps, 'children'>

const DataReviewStep = ({ ocrData, template, onGoBack, onGoNext }: TProps) => {
  return (
    <ManageDataWrapper
      ocrData={ocrData}
      template={template}
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
