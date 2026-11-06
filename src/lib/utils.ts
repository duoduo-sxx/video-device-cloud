import clsx, { type ClassValue } from 'clsx'

export const cn = (...args: ClassValue[]) => clsx(args)

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`
