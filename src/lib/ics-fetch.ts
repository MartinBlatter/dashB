import { lookup } from 'node:dns/promises';

import {
    isBlockedAddress,
    isBlockedHostname,
    normalizeFeedUrl,
} from '#/lib/calendar-url';

const MAX_FEED_BYTES = 5_242_880;

const MAX_REDIRECTS = 4;

const FETCH_TIMEOUT_MS = 10_000;

const FEED_USER_AGENT = 'dashb-calendar/1.0';

async function assertPublicHost(target: string): Promise<void> {
    const { hostname } = new URL(target);

    if (isBlockedHostname(hostname)) throw new Error('blocked_host');

    const host = hostname.replace(/^\[|\]$/g, '');
    const records = await lookup(host, { all: true, verbatim: true }).catch(
        () => []
    );

    if (records.length === 0) throw new Error('dns_failed');

    for (const record of records) {
        if (isBlockedAddress(record.address)) throw new Error('blocked_host');
    }
}

async function readCapped(response: Response): Promise<string> {
    const reader = response.body?.getReader();

    if (!reader) throw new Error('empty_response');

    const chunks: Array<Uint8Array> = [];
    let total = 0;

    for (;;) {
        const { done, value } = await reader.read();

        if (done) break;

        total += value.byteLength;

        if (total > MAX_FEED_BYTES) {
            await reader.cancel();
            throw new Error('too_large');
        }

        chunks.push(value);
    }

    const merged = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return new TextDecoder('utf-8').decode(merged);
}

export async function fetchFeedText(rawUrl: string): Promise<string> {
    let current = normalizeFeedUrl(rawUrl);

    if (!current) throw new Error('invalid_url');

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        await assertPublicHost(current);

        const response = await fetch(current, {
            redirect: 'manual',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {
                accept: 'text/calendar, text/plain;q=0.9, */*;q=0.1',
                'user-agent': FEED_USER_AGENT,
            },
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');

            if (!location) throw new Error('bad_redirect');

            const next = normalizeFeedUrl(
                new URL(location, current).toString()
            );

            if (!next) throw new Error('bad_redirect');

            current = next;
            continue;
        }

        if (!response.ok) throw new Error(`http_${response.status}`);

        return await readCapped(response);
    }

    throw new Error('too_many_redirects');
}
