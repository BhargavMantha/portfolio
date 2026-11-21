import { expect, it } from 'vitest'
import { daysBetween } from './days'

it('counts 1,461 days from the wedding to the fourth anniversary', () => {
  expect(daysBetween('2022-12-18', '2026-12-18')).toBe(1461)
})

it('is zero for the same day', () => {
  expect(daysBetween('2022-12-18', '2022-12-18')).toBe(0)
})

it('is not thrown off by time zones', () => {
  expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2)
})
