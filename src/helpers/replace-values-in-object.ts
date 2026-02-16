const replaceValuesInObject = ({
  object,
  valueToReplace,
  valueToReplaceWith,
}: {
  object: Record<string, any>
  valueToReplace: any
  valueToReplaceWith: any
}) => {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      value === valueToReplace ? valueToReplaceWith : value,
    ]),
  )
}

export { replaceValuesInObject }
