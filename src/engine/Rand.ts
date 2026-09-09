/** Deterministic hash-based pseudo-random in [0, 1). Same input always gives
 * the same output, so texture detail stays stable frame to frame instead of
 * flickering like Math.random() would. */
export function hashRandom(seed: number): number {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  x -= Math.floor(x);
  return x;
}

export function hashRandom2(a: number, b: number): number {
  return hashRandom(a * 12.9898 + b * 78.233);
}

/** Small seeded generator for when several values are needed from one seed. */
export function makeRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
