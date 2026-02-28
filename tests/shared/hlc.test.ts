import { describe, it, expect } from 'vitest'
import { nextHlc, parseHlc } from '~/shared/hlc'

describe('HLC', () => {
  it('generates a valid HLC string', () => {
    const { hlc, wallMs } = nextHlc({ nowMs: 1000, lastHlc: '', nodeId: 'node-1' })
    expect(typeof hlc).toBe('string')
    expect(wallMs).toBe(1000)

    const parsed = parseHlc(hlc)
    expect(parsed.wallMs).toBe(1000)
    expect(parsed.counter).toBe(0)
    expect(parsed.nodeId).toBe('node-1')
  })

  it('increments counter when wall clock does not advance', () => {
    const first = nextHlc({ nowMs: 1000, lastHlc: '', nodeId: 'n' })
    const second = nextHlc({ nowMs: 1000, lastHlc: first.hlc, nodeId: 'n' })
    const third = nextHlc({ nowMs: 1000, lastHlc: second.hlc, nodeId: 'n' })

    const p1 = parseHlc(first.hlc)
    const p2 = parseHlc(second.hlc)
    const p3 = parseHlc(third.hlc)

    expect(p1.counter).toBe(0)
    expect(p2.counter).toBe(1)
    expect(p3.counter).toBe(2)
  })

  it('resets counter when wall clock advances', () => {
    const first = nextHlc({ nowMs: 1000, lastHlc: '', nodeId: 'n' })
    const second = nextHlc({ nowMs: 1000, lastHlc: first.hlc, nodeId: 'n' })
    const third = nextHlc({ nowMs: 2000, lastHlc: second.hlc, nodeId: 'n' })

    const p3 = parseHlc(third.hlc)
    expect(p3.wallMs).toBe(2000)
    expect(p3.counter).toBe(0)
  })

  it('produces lexicographically sortable strings', () => {
    const hlcs: string[] = []
    let last = ''
    for (let i = 0; i < 5; i++) {
      const { hlc } = nextHlc({ nowMs: 1000 + i * 100, lastHlc: last, nodeId: 'dev' })
      hlcs.push(hlc)
      last = hlc
    }
    const sorted = [...hlcs].sort()
    expect(sorted).toEqual(hlcs)
  })
})
