import { hkdfSync, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

export function loadSecret(file) {
    const created = randomBytes(32).toString('base64url');

    try {
        writeFileSync(file, created, { mode: 0o600, flag: 'wx' });

        return created;
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }

        const existing = readFileSync(file, 'utf8').trim();

        if (existing.length === 0) {
            throw new Error(`secret file is empty: ${file}`);
        }

        return existing;
    }
}

export function localCredentials(secret) {
    const password = Buffer.from(
        hkdfSync('sha256', secret, 'dashb-desktop', 'local-user', 32)
    ).toString('hex');

    return { email: 'local@dashb.localhost', name: 'Local', password };
}
