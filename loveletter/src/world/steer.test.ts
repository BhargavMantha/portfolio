import { describe, expect, it } from 'vitest'
import { GALLOP_SPEED, JUMP_SPEED, MAX_SPEED, gaitOf, pushOut, stepBoat, stepJump, type Boat } from './steer'

const bounds = { minX: -40, maxX: 40, minZ: -150, maxZ: 20 }
const still: Boat = { x: 0, z: 0, heading: 0, speed: 0 }
const idle = { turn: 0, thrust: 0 } as const

const run = (b: Boat, input: Parameters<typeof stepBoat>[1], seconds: number) => {
  for (let t = 0; t < seconds; t += 1 / 60) b = stepBoat(b, input, 1 / 60, bounds)
  return b
}

describe('stepBoat', () => {
  it('sails forward (towards −z) under thrust and tops out at the speed limit', () => {
    const b = run(still, { turn: 0, thrust: 1 }, 6)
    expect(b.z).toBeLessThan(-10)
    expect(b.x).toBeCloseTo(0, 5)
    expect(b.speed).toBeLessThanOrEqual(MAX_SPEED)
    expect(b.speed).toBeGreaterThan(MAX_SPEED * 0.9)
  })

  it('drifts to a stop when the keys are released', () => {
    const moving = run(still, { turn: 0, thrust: 1 }, 3)
    expect(run(moving, idle, 8).speed).toBeLessThan(0.05)
  })

  it('turns left with a positive turn and right with a negative one', () => {
    expect(run(still, { turn: 1, thrust: 1 }, 1).x).toBeLessThan(0)
    expect(run(still, { turn: -1, thrust: 1 }, 1).x).toBeGreaterThan(0)
  })

  it('backs up slowly', () => {
    const b = run(still, { turn: 0, thrust: -1 }, 3)
    expect(b.z).toBeGreaterThan(0)
    expect(Math.abs(b.speed)).toBeLessThanOrEqual(MAX_SPEED / 2)
  })

  it('sails itself to a target and stops there', () => {
    const target = { x: 12, z: -20 }
    const b = run(still, { ...idle, target }, 20)
    expect(Math.hypot(b.x - target.x, b.z - target.z)).toBeLessThan(0.6)
    expect(Math.abs(b.speed)).toBeLessThan(0.3)
  })

  it('reaches a target that is directly behind it', () => {
    const target = { x: 0, z: 15 }
    const b = run(still, { ...idle, target }, 25)
    expect(Math.hypot(b.x - target.x, b.z - target.z)).toBeLessThan(0.6)
  })

  it('never leaves the sea', () => {
    const b = run({ ...still, heading: -Math.PI / 2 }, { turn: 0, thrust: 1 }, 30)
    expect(b.x).toBeLessThanOrEqual(bounds.maxX)
    const c = run(still, { turn: 0, thrust: -1 }, 60)
    expect(c.z).toBeLessThanOrEqual(bounds.maxZ)
  })

  it('survives a long frame after the tab was in the background', () => {
    const b = stepBoat({ ...still, speed: MAX_SPEED }, { turn: 1, thrust: 1 }, 5, bounds)
    expect(Number.isFinite(b.x) && Number.isFinite(b.z) && Number.isFinite(b.heading)).toBe(true)
    expect(Math.hypot(b.x, b.z)).toBeLessThan(2)
  })
})

describe('riding', () => {
  it('gallops faster than she canters, and settles back when Shift is released', () => {
    const canter = run(still, { turn: 0, thrust: 1 }, 6)
    const gallop = run(still, { turn: 0, thrust: 1, sprint: true }, 6)
    expect(gallop.speed).toBeGreaterThan(canter.speed + 3)
    expect(gallop.speed).toBeLessThanOrEqual(GALLOP_SPEED)
    const eased = run(gallop, { turn: 0, thrust: 1 }, 4)
    expect(eased.speed).toBeCloseTo(MAX_SPEED, 0)
  })

  it('turns wider at a gallop than at a walk', () => {
    const slow = run({ ...still, speed: 1.5 }, { turn: 1, thrust: 0 }, 0.5)
    const fast = run({ ...still, speed: GALLOP_SPEED }, { turn: 1, thrust: 1, sprint: true }, 0.5)
    expect(slow.heading).toBeGreaterThan(fast.heading)
  })

  it('carries turn momentum for a moment after the reins are released', () => {
    const turning = run({ ...still, speed: 4 }, { turn: 1, thrust: 1 }, 1)
    const after = stepBoat(turning, { turn: 0, thrust: 1 }, 1 / 60, bounds)
    expect(after.heading).toBeGreaterThan(turning.heading)
  })

  it('names the gait from the speed', () => {
    expect(gaitOf(0)).toBe('stand')
    expect(gaitOf(1)).toBe('walk')
    expect(gaitOf(3)).toBe('trot')
    expect(gaitOf(MAX_SPEED)).toBe('canter')
    expect(gaitOf(GALLOP_SPEED)).toBe('gallop')
  })

  it('jumps up and lands again', () => {
    let j = { y: 0.001, vy: JUMP_SPEED }
    let peak = 0
    let landed = false
    for (let t = 0; t < 2 && !landed; t += 1 / 60) {
      const n = stepJump(j, 1 / 60)
      peak = Math.max(peak, n.y)
      landed = n.landed
      j = n
    }
    expect(peak).toBeGreaterThan(0.7)
    expect(landed).toBe(true)
    expect(j.y).toBe(0)
  })
})

describe('pushOut', () => {
  it('keeps the boat off an island', () => {
    const p = pushOut({ x: 1, z: 0 }, [{ x: 0, z: 0, r: 4 }])
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(4)
  })
  it('leaves the boat alone in open water', () => {
    expect(pushOut({ x: 10, z: 0 }, [{ x: 0, z: 0, r: 4 }])).toEqual({ x: 10, z: 0 })
  })
  it('handles sitting exactly on the centre', () => {
    const p = pushOut({ x: 0, z: 0 }, [{ x: 0, z: 0, r: 4 }])
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(4)
  })
})
