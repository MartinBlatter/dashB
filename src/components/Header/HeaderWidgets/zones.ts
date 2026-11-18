export const commonTimeZones: ReadonlyArray<string> = [
    'UTC',
    'Europe/London',
    'Europe/Dublin',
    'Europe/Lisbon',
    'Europe/Madrid',
    'Europe/Paris',
    'Europe/Brussels',
    'Europe/Amsterdam',
    'Europe/Berlin',
    'Europe/Zurich',
    'Europe/Vienna',
    'Europe/Rome',
    'Europe/Prague',
    'Europe/Warsaw',
    'Europe/Stockholm',
    'Europe/Helsinki',
    'Europe/Athens',
    'Europe/Istanbul',
    'Europe/Kyiv',
    'Europe/Moscow',
    'America/New_York',
    'America/Toronto',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Bogota',
    'America/Sao_Paulo',
    'America/Argentina/Buenos_Aires',
    'Africa/Cairo',
    'Africa/Lagos',
    'Africa/Nairobi',
    'Africa/Johannesburg',
    'Asia/Jerusalem',
    'Asia/Dubai',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Dhaka',
    'Asia/Bangkok',
    'Asia/Jakarta',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Perth',
    'Australia/Sydney',
    'Pacific/Auckland',
    'Pacific/Honolulu',
];

export function timeZoneLabel(zone: string): string {
    const parts = zone.split('/');

    if (parts.length === 1) return zone;

    const city = parts[parts.length - 1].replace(/_/g, ' ');
    const region = parts[0].replace(/_/g, ' ');

    return `${city}, ${region}`;
}

export function isSupportedTimeZone(zone: string): boolean {
    try {
        new Intl.DateTimeFormat(undefined, { timeZone: zone });

        return true;
    } catch {
        return false;
    }
}
