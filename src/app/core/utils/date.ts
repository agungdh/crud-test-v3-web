const displayFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Parses an ISO `yyyy-MM-dd` value as a local date. Using the Date constructor
 * with a string would treat it as UTC and can shift the day in negative offsets.
 */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

/** Formats a `Date` as `yyyy-MM-dd`, the format expected by the API. */
export function toIsoDate(value: Date | null | undefined): string {
  if (!value) {
    return '';
  }

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Formats an ISO date for display, e.g. `09 Sep 1970`. */
export function formatTanggal(value: string | null | undefined): string {
  const date = parseIsoDate(value);

  return date ? displayFormatter.format(date) : '-';
}

/** Last date accepted by the datepicker: yesterday, because the API requires `@Past`. */
export function yesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);

  return date;
}
