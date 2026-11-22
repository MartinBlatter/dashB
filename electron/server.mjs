import electron from 'electron';
import { createWriteStream } from 'node:fs';
import { createServer } from 'node:net';
import process from 'node:process';
import { requestJson } from './http.mjs';

const { utilityProcess } = electron;

export function portIsFree(port) {
    return new Promise((resolve) => {
        const probe = createServer();

        probe.once('error', () => resolve(false));
        probe.once('listening', () => probe.close(() => resolve(true)));
        probe.listen(port, '127.0.0.1');
    });
}

export async function choosePort(preferred, attempts) {
    for (let offset = 0; offset < attempts; offset += 1) {
        const candidate = preferred + offset;

        if (await portIsFree(candidate)) {
            return candidate;
        }
    }

    throw new Error(`no free port in ${preferred}-${preferred + attempts - 1}`);
}

export function startServer(options) {
    const inherited = { ...process.env };

    delete inherited.ELECTRON_RUN_AS_NODE;

    const child = utilityProcess.fork(options.entry, [], {
        cwd: options.cwd,
        stdio: 'pipe',
        serviceName: 'dashb-server',
        env: {
            ...inherited,
            NODE_ENV: 'production',
            HOST: '127.0.0.1',
            NITRO_HOST: '127.0.0.1',
            PORT: String(options.port),
            NITRO_PORT: String(options.port),
            DATABASE_URL: `file:${options.database}`,
            BETTER_AUTH_SECRET: options.secret,
            BETTER_AUTH_URL: options.origin,
            BETTER_AUTH_TRUSTED_ORIGINS: options.origin,
        },
    });

    const log = createWriteStream(options.log, { flags: 'a' });

    child.stdout?.pipe(log);
    child.stderr?.pipe(log);

    return child;
}

export async function waitForServer(origin, timeout) {
    const deadline = Date.now() + timeout;
    let lastError = 'no response';

    while (Date.now() < deadline) {
        try {
            const response = await requestJson(`${origin}/api/auth/ok`, {
                timeout: 2000,
            });

            if (response.status === 200) {
                return;
            }

            lastError = `status ${response.status}`;
        } catch (error) {
            lastError = error.message;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
    }

    throw new Error(`server did not become ready: ${lastError}`);
}
