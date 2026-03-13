'use client'

import { useCallback, useState } from 'react'

const useSessionStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = sessionStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value

        try {
          if (newValue === null || newValue === undefined) {
            sessionStorage.removeItem(key)
          } else {
            sessionStorage.setItem(key, JSON.stringify(newValue))
          }
        } catch {
          // sessionStorage may be full or unavailable
        }

        return newValue
      })
    },
    [key],
  )

  const removeValue = useCallback(() => {
    setStoredValue(initialValue)
    try {
      sessionStorage.removeItem(key)
    } catch {
      // ignore
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

export { useSessionStorage }
