const BLOCKED_HOSTNAMES: ReadonlySet<string> = new Set([
    'localhost',
    'localhost.localdomain',
    'ip6-localhost',
    'ip6-loopback',
    'metadata',
    'metadata.google.internal',
]);

export function normalizeFeedUrl(raw: string): string | null {
    const trimmed = raw.trim();

    if (trimmed === '') return null;

    const withScheme = trimmed.replace(/^webcals?:\/\//i, 'https://');

    let parsed: URL;

    try {
        parsed = new URL(withScheme);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
    }

    if (parsed.hostname === '') return null;

    return parsed.toString();
}

export function isBlockedHostname(hostname: string): boolean {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (BLOCKED_HOSTNAMES.has(host)) return true;
    if (host.endsWith('.localhost') || host.endsWith('.internal')) return true;

    return isBlockedAddress(host);
}

export function isBlockedAddress(address: string): boolean {
    const host = address.replace(/^\[|\]$/g, '');

    if (isIpv4(host)) return isBlockedIpv4(host);
    if (host.includes(':')) return isBlockedIpv6(host);

    return false;
}

function isIpv4(value: string): boolean {
    const parts = value.split('.');

    return (
        parts.length === 4 &&
        parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
    );
}

function isBlockedIpv4(value: string): boolean {
    const [a, b] = value.split('.').map(Number);

    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;

    return false;
}

function isBlockedIpv6(value: string): boolean {
    const host = value.toLowerCase();

    if (host === '::' || host === '::1') return true;

    const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(host);

    if (mapped?.[1]) return isBlockedIpv4(mapped[1]);

    const head = host.split(':').at(0) ?? '';

    if (head.startsWith('fe8') || head.startsWith('fe9')) return true;
    if (head.startsWith('fea') || head.startsWith('feb')) return true;
    if (head.startsWith('fc') || head.startsWith('fd')) return true;
    if (head.startsWith('ff')) return true;

    return false;
}
