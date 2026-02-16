const extractNumbersFromString = (str: string = '') => {
  const matches = (str || '').match(/-?\d+\.?\d*/g)
  return matches ? matches.map(Number) : []
}

const extractNumbersFromStringAndAdd = (str: string) =>
  extractNumbersFromString(str).reduce((acc, num) => +acc + +num, 0)

export { extractNumbersFromString, extractNumbersFromStringAndAdd }
