import loIsEmpty from 'lodash/isEmpty'
import loIsEqual from 'lodash/isEqual'

export const isEmpty = (val: unknown) => loIsEmpty(val)
export const isEqual = (arr1: any, arr2: any) => loIsEqual(arr1, arr2)