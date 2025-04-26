'use client'

import isEmpty from "lodash/isEmpty";
import { useEffect, useState } from "react";

const setStorage = (type: 'session' | 'local', key: string, item?: string) => {
  if (isEmpty(item)) {
    console.error('You must provide an item to fetch from storage')
    return null
  }

  if (type === 'session') {
    sessionStorage.setItem(key, String(item))
  }

  if (type === 'local') {
    localStorage.setItem(key, String(item))
  }

  return item
}

const getStorage = (type: 'session' | 'local', key: string, defaultValue?: string) => {
  let item = null

  if (type === 'session') {
    item = sessionStorage.getItem(key)
  }

  if (type === 'local') {
    item = localStorage.getItem(key)
  }

  if (isEmpty(item) && !isEmpty(defaultValue)) {
    return setStorage(type, key, String(defaultValue))
  }

  return item
}

export const useStorage = (type: 'session' | 'local', key: string, options?: { item?: string, initMethod?: 'get' | 'set' }) => {
  const [initItem, setIniItem] = useState<string | null | undefined>()

  useEffect(() => {
    if (options?.initMethod === 'get') {
      setIniItem(getStorage(type, key, options?.item))
    }

    if (options?.initMethod === 'set') {
      setStorage(type, key, options?.item)
    }
  }, [])

  return { setStorage, getStorage, initItem }
}
