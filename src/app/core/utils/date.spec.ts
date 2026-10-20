import { formatTanggal, parseIsoDate, toIsoDate, yesterday } from './date';

describe('date utils', () => {
  it('parses ISO dates as local dates', () => {
    const date = parseIsoDate('1990-01-01');

    expect(date?.getFullYear()).toBe(1990);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(1);
  });

  it('returns null for missing or invalid values', () => {
    expect(parseIsoDate(null)).toBeNull();
    expect(parseIsoDate('bukan-tanggal')).toBeNull();
  });

  it('formats a Date as yyyy-MM-dd', () => {
    expect(toIsoDate(new Date(1990, 1, 1))).toBe('1990-02-01');
    expect(toIsoDate(null)).toBe('');
  });

  it('formats ISO dates for display in Indonesian', () => {
    expect(formatTanggal('1990-01-01')).toBe('01 Jan 1990');
    expect(formatTanggal(null)).toBe('-');
  });

  it('returns yesterday at midnight for the datepicker max', () => {
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    expected.setHours(0, 0, 0, 0);

    expect(yesterday().getTime()).toBe(expected.getTime());
  });
});
