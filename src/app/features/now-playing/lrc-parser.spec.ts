import { activeLyricIndex, parseLrc } from './lrc-parser';

describe('LRC parser', () => {
  it('sorts timed lines, expands repeated timestamps and applies offset', () => {
    const lines = parseLrc('[ar:Artist]\n[offset:+500]\n[00:02.5][00:01.25] Hello \n[00:03]World');
    expect(lines).toEqual([
      { time: 1.75, text: 'Hello' },
      { time: 3, text: 'Hello' },
      { time: 3.5, text: 'World' },
    ]);
    expect(activeLyricIndex(lines, 1)).toBe(-1);
    expect(activeLyricIndex(lines, 3.2)).toBe(1);
    expect(activeLyricIndex(lines, 0)).toBe(-1);
  });

  it('ignores metadata, malformed timestamps and lyrics without timing', () => {
    expect(parseLrc('[ar:Artist]\nWords without time\n[00:99.00]Invalid')).toEqual([]);
    expect(parseLrc('[offset:-500]\n[00:00.20]Start')).toEqual([{ time: 0, text: 'Start' }]);
  });
});
