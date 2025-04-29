export function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function randomRangeInt(min: number, max: number) {
  return Math.floor(randomRange(min, max + 1));
}
