import NumberFlow from '@number-flow/react'
import { useEffect, useState } from 'react'
import { ANNIVERSARY, WEDDING_DAY, daysBetween } from '../lib/days'

export const DAYS = daysBetween(WEDDING_DAY, ANNIVERSARY)

/** Chapter 2: a single lit window in the dark. */
export function LitWindow() {
  return (
    <div className="lit-window" aria-hidden="true">
      <span />
    </div>
  )
}

/** Chapter 6: the count rolls up when the beat comes into view. */
export function DayCounter({ active, animate = true }: { active: boolean; animate?: boolean }) {
  const [value, setValue] = useState(animate ? 0 : DAYS)
  useEffect(() => {
    if (animate && active) setValue(DAYS)
  }, [active, animate])

  if (!animate) return <p className="day-counter">{DAYS.toLocaleString('en-US')}</p>
  return (
    <p className="day-counter" aria-label={`${DAYS.toLocaleString('en-US')} days`}>
      <NumberFlow value={value} locales="en-US" transformTiming={{ duration: 2400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }} />
    </p>
  )
}
