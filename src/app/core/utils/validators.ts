import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Group validator for diklat: `dari_tanggal_pelaksanaan` may not be later than
 * `sampai_tanggal_pelaksanaan`. The backend returns 400 for the same rule.
 */
export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value as Date | null;
    const end = group.get(endKey)?.value as Date | null;

    if (!start || !end) {
      return null;
    }

    return dayValue(start) > dayValue(end) ? { dateRange: true } : null;
  };
}

/** Rejects values that only contain whitespace, matching the backend `@NotBlank`. */
export function notBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? null : { blank: true };
}

/** Rejects decimals and non-numeric values; used for `jumlah_jam` inputs. */
export function integerValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isInteger(Number(value)) ? null : { integer: true };
}

function dayValue(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}
