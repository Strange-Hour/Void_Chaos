import { ConditionParams } from './types';

export function and(...conds: ((params: ConditionParams) => boolean)[]) {
  return (params: ConditionParams) => conds.every(fn => fn(params));
}

export function or(...conds: ((params: ConditionParams) => boolean)[]) {
  return (params: ConditionParams) => conds.some(fn => fn(params));
}

export function not(cond: (params: ConditionParams) => boolean) {
  return (params: ConditionParams) => !cond(params);
} 