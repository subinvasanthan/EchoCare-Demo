import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';

export function toUTCFromLocal(localISOOrDate: string | Date, timeZone: string): Date {
  return zonedTimeToUtc(localISOOrDate, timeZone);
}

export function formatInZone(
  utcISOOrDate: string | Date | null,
  timeZone: string,
  fmt = 'dd MMM yyyy, hh:mm a'
): string {
  if (!utcISOOrDate) return 'Not set';
  return formatInTimeZone(utcISOOrDate, timeZone, fmt);
}

// Returns an RFC3339 string with the patient's timezone offset, e.g. 2025-12-09T15:30:00+03:00
export function toZonedOffsetISOString(localISOOrDate: string | Date, timeZone: string): string {
  // Convert the local wall time in zone to the UTC instant
  const utcInstant = zonedTimeToUtc(localISOOrDate, timeZone);
  // Format that instant back in the zone with an explicit numeric offset
  return formatInTimeZone(utcInstant, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}


