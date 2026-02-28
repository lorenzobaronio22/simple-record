/**
 * Hybrid Logical Clock (HLC) generator.
 *
 * Produces a single lexicographically-sortable string of the form:
 *
 *   <wallMs-hex-12>-<counter-hex-4>-<nodeId>
 *
 * where `wallMs` is zero-padded to 12 hex digits (good until year 10889),
 * `counter` is zero-padded to 4 hex digits, and `nodeId` is the raw string
 * passed in (typically `deviceId`).
 */

export interface HlcInput {
  /** Current wall-clock time in milliseconds. */
  nowMs: number
  /** The last HLC string this node produced (empty string on first call). */
  lastHlc: string
  /** Unique node / device identifier. */
  nodeId: string
}

export interface HlcOutput {
  /** The new HLC string. */
  hlc: string
  /** The wall-clock component embedded in the HLC (ms). */
  wallMs: number
}

/** Parse an HLC string back into its three components. */
export function parseHlc(hlc: string): {
  wallMs: number
  counter: number
  nodeId: string
} {
  const firstDash = hlc.indexOf('-')
  const secondDash = hlc.indexOf('-', firstDash + 1)
  return {
    wallMs: parseInt(hlc.slice(0, firstDash), 16),
    counter: parseInt(hlc.slice(firstDash + 1, secondDash), 16),
    nodeId: hlc.slice(secondDash + 1),
  }
}

/** Format components into the canonical HLC string. */
function formatHlc(wallMs: number, counter: number, nodeId: string): string {
  const ts = wallMs.toString(16).padStart(12, '0')
  const ct = counter.toString(16).padStart(4, '0')
  return `${ts}-${ct}-${nodeId}`
}

/**
 * Generate the next HLC.
 *
 * Guarantees:
 * - Monotonically increasing with respect to `lastHlc`.
 * - Lexicographic ordering matches causal ordering.
 * - Ties broken by incrementing the counter.
 */
export function nextHlc({ nowMs, lastHlc, nodeId }: HlcInput): HlcOutput {
  let lastWall = 0
  let lastCounter = 0

  if (lastHlc) {
    const parsed = parseHlc(lastHlc)
    lastWall = parsed.wallMs
    lastCounter = parsed.counter
  }

  let wall: number
  let counter: number

  if (nowMs > lastWall) {
    wall = nowMs
    counter = 0
  } else {
    wall = lastWall
    counter = lastCounter + 1
  }

  const hlc = formatHlc(wall, counter, nodeId)
  return { hlc, wallMs: wall }
}
