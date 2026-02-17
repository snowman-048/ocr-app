import { TTemplateRecord } from '..'

const convertTemplateRecords = <T extends Record<string, any>>(records: TTemplateRecord[]) =>
  records.map((record) =>
    record.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {} as T),
  )

export { convertTemplateRecords }
