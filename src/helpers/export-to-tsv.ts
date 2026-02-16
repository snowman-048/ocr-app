const exportToTsv = (data: Record<string, any>[], columnsOrder?: string[]) =>
  data
    .map((item) => {
      const values = columnsOrder ? columnsOrder.map((key) => item[key]) : Object.values(item)

      return values.join('\t')
    })
    .join('\n')

export { exportToTsv }
