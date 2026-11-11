import { RuntimePipe } from './runtime.pipe';

describe('RuntimePipe', () => {
  const pipe = new RuntimePipe();

  it('when the duration is over an hour, then hours and zero-padded minutes are shown', () => {
    expect(pipe.transform(126)).toBe('2h 06m');
  });

  it('when the duration is under an hour, then only minutes are shown', () => {
    expect(pipe.transform(45)).toBe('45m');
  });
});
