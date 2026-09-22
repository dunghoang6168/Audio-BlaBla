import { createLogFrequencyBands, decaySpectrumLevels, updateSpectrumLevels } from './spectrum-utils';

describe('spectrum utilities', () => {
  it('creates ordered logarithmic bands inside the FFT buffer', () => {
    const bands = createLogFrequencyBands(1024, 48);

    expect(bands.length).toBe(48);
    expect(bands[0].start).toBeGreaterThanOrEqual(0);
    expect(bands.at(-1)?.end).toBeLessThanOrEqual(1024);
    for (let index = 1; index < bands.length; index++) {
      expect(bands[index].start).toBeGreaterThanOrEqual(bands[index - 1].start);
      expect(bands[index].end).toBeGreaterThan(bands[index].start);
    }
  });

  it('maps frequency peaks to normalized bar levels without reallocating output', () => {
    const data = new Uint8Array([0, 64, 128, 255]);
    const bands = [{ start: 0, end: 2 }, { start: 2, end: 4 }];
    const levels = new Float32Array(2);

    updateSpectrumLevels(data, bands, levels);

    expect(levels[0]).toBeGreaterThan(0);
    expect(levels[0]).toBeLessThan(levels[1]);
    expect(levels[1]).toBeLessThanOrEqual(1);
  });

  it('decays paused levels to zero and reports when animation can stop', () => {
    const levels = new Float32Array([0.5, 0.25]);
    expect(decaySpectrumLevels(levels, 0.5)).toBeTrue();
    for (let index = 0; index < 8; index++) decaySpectrumLevels(levels, 0.5);
    expect(decaySpectrumLevels(levels, 0.5)).toBeFalse();
    expect(Array.from(levels)).toEqual([0, 0]);
  });
});
