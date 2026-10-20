import { Injectable } from '@angular/core';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';

/**
 * Date formats for the native adapter. Angular Material 22 expects Intl options
 * objects here, not pattern strings, so the picker renders `dd/MM/yyyy` while
 * the API still receives `yyyy-MM-dd`.
 */
export const ID_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: null,
    timeInput: null,
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    timeInput: { hour: '2-digit', minute: '2-digit' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { day: 'numeric', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
    timeOptionLabel: { hour: '2-digit', minute: '2-digit' },
  },
};

/** Native adapter with `id-ID` locale and unambiguous `dd/MM/yyyy` parsing. */
@Injectable()
export class IdDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const match = value.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);

      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        const date = new Date(year, month - 1, day);
        const isValid =
          date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

        return isValid ? date : null;
      }
    }

    return super.parse(value, parseFormat);
  }
}
