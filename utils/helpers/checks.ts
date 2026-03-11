import loIsEmpty from 'lodash/isEmpty';
import loIsEqual from 'lodash/isEqual';

export const isEmpty = (val: unknown) => loIsEmpty(val);
export const isEqual = <T>(arr1: T, arr2: T) => loIsEqual(arr1, arr2);
