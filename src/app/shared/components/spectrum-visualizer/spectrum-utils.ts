export interface FrequencyBand {
  readonly start: number;
  readonly end: number;
}

export function createLogFrequencyBands(
  binCount: number,
  barCount: number,
  sampleRate = 48_000,
  minimumFrequency = 40,
  maximumFrequency = 16_000,
): FrequencyBand[] {
  if (binCount <= 0 || barCount <= 0 || sampleRate <= 0) return [];
  const nyquist = sampleRate / 2;
  const minimum = Math.max(1, Math.min(minimumFrequency, nyquist));
  const maximum = Math.max(minimum, Math.min(maximumFrequency, nyquist));
  const ratio = maximum / minimum;

  return Array.from({ length: barCount }, (_, index) => {
    const lowHz = minimum * Math.pow(ratio, index / barCount);
    const highHz = minimum * Math.pow(ratio, (index + 1) / barCount);
    const start = Math.max(0, Math.min(binCount - 1, Math.floor(lowHz / nyquist * binCount)));
    const end = Math.max(start + 1, Math.min(binCount, Math.ceil(highHz / nyquist * binCount)));
    return { start, end };
  });
}

export function updateSpectrumLevels(
  frequencyData: Uint8Array,
  bands: readonly FrequencyBand[],
  levels: Float32Array,
): void {
  const count = Math.min(bands.length, levels.length);
  for (let bandIndex = 0; bandIndex < count; bandIndex++) {
    const band = bands[bandIndex];
    let peak = 0;
    for (let index = band.start; index < band.end && index < frequencyData.length; index++) {
      peak = Math.max(peak, frequencyData[index]);
    }
    const next = peak / 255;
    levels[bandIndex] = next >= levels[bandIndex]
      ? levels[bandIndex] * 0.28 + next * 0.72
      : levels[bandIndex] * 0.86 + next * 0.14;
  }
}

export function decaySpectrumLevels(levels: Float32Array, factor: number): boolean {
  let active = false;
  for (let index = 0; index < levels.length; index++) {
    levels[index] *= factor;
    if (levels[index] > 0.01) active = true;
    else levels[index] = 0;
  }
  return active;
}
