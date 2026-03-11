'use client'

import isEmpty from "lodash/isEmpty";

const setStorage = (type: 'session' | 'local', key: string, item?: string) => {
  if (typeof window === 'undefined') return null;

  if (isEmpty(item)) {
    console.error('You must provide an item to fetch from storage');
    return null;
  }

  if (type === 'session') {
    window.sessionStorage.setItem(key, String(item));
  }

  if (type === 'local') {
    window.localStorage.setItem(key, String(item));
  }

  return item;
}

const getStorage = (type: 'session' | 'local', key: string, defaultValue?: string) => {
  if (typeof window === 'undefined') return null;

  let item: string | null = null;

  if (type === 'session') {
    item = window.sessionStorage.getItem(key);
  }

  if (type === 'local') {
    item = window.localStorage.getItem(key);
  }

  if (isEmpty(item) && !isEmpty(defaultValue)) {
    return setStorage(type, key, String(defaultValue));
  }

  return item;
}

export const useStorage = (
  type: 'session' | 'local',
  key: string,
  options?: { item?: string; initMethod?: 'get' | 'set' },
) => {
  let initItem: string | null | undefined = null;

  if (options?.initMethod === 'get') {
    initItem = getStorage(type, key, options.item);
  } else if (options?.initMethod === 'set') {
    initItem = setStorage(type, key, options.item);
  }

  return { setStorage, getStorage, initItem };
}
