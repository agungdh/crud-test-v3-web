import { FormControl, FormGroup } from '@angular/forms';
import { dateRangeValidator, integerValidator, notBlankValidator } from './validators';

describe('dateRangeValidator', () => {
  function buildGroup(start: Date | null, end: Date | null): FormGroup {
    return new FormGroup(
      {
        dari: new FormControl<Date | null>(start),
        sampai: new FormControl<Date | null>(end),
      },
      { validators: dateRangeValidator('dari', 'sampai') },
    );
  }

  it('accepts a start date before the end date', () => {
    const group = buildGroup(new Date(2026, 0, 5), new Date(2026, 0, 9));

    expect(group.valid).toBe(true);
  });

  it('accepts the same start and end date', () => {
    const group = buildGroup(new Date(2026, 0, 5), new Date(2026, 0, 5));

    expect(group.valid).toBe(true);
  });

  it('ignores the time component when comparing', () => {
    const group = buildGroup(new Date(2026, 0, 5, 23, 59), new Date(2026, 0, 5, 0, 0));

    expect(group.valid).toBe(true);
  });

  it('rejects a start date after the end date', () => {
    const group = buildGroup(new Date(2026, 0, 10), new Date(2026, 0, 9));

    expect(group.hasError('dateRange')).toBe(true);
    expect(group.valid).toBe(false);
  });

  it('passes while one of the dates is still empty', () => {
    const group = buildGroup(new Date(2026, 0, 10), null);

    expect(group.hasError('dateRange')).toBe(false);
  });
});

describe('notBlankValidator', () => {
  it('accepts text with visible characters', () => {
    expect(notBlankValidator(new FormControl('Seminar'))).toBeNull();
  });

  it('rejects empty and whitespace-only strings', () => {
    expect(notBlankValidator(new FormControl(''))).toEqual({ blank: true });
    expect(notBlankValidator(new FormControl('   '))).toEqual({ blank: true });
  });

  it('leaves non-string values alone', () => {
    expect(notBlankValidator(new FormControl(null))).toBeNull();
  });
});

describe('integerValidator', () => {
  it('accepts whole numbers and empty values', () => {
    expect(integerValidator(new FormControl(0))).toBeNull();
    expect(integerValidator(new FormControl(12))).toBeNull();
    expect(integerValidator(new FormControl(null))).toBeNull();
    expect(integerValidator(new FormControl(''))).toBeNull();
  });

  it('rejects decimals', () => {
    expect(integerValidator(new FormControl(1.5))).toEqual({ integer: true });
    expect(integerValidator(new FormControl('2.25'))).toEqual({ integer: true });
  });
});
