import http from 'node:http';

export function requestJson(url, options) {
    const method = options?.method ?? 'GET';
    const payload =
        options?.body === undefined ? null : JSON.stringify(options.body);

    return new Promise((resolve, reject) => {
        const headers = {};

        if (payload !== null) {
            headers['content-type'] = 'application/json';
            headers['content-length'] = Buffer.byteLength(payload);
        }

        if (options?.cookie !== undefined) {
            headers.cookie = options.cookie;
        }

        const request = http.request(
            url,
            { method, headers, timeout: options?.timeout ?? 15000 },
            (response) => {
                const chunks = [];

                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const text = Buffer.concat(chunks).toString('utf8');
                    let data = null;

                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = null;
                    }

                    resolve({
                        status: response.statusCode ?? 0,
                        cookies: response.headers['set-cookie'] ?? [],
                        text,
                        data,
                    });
                });
            }
        );

        request.on('timeout', () => request.destroy(new Error('timeout')));
        request.on('error', reject);

        if (payload !== null) {
            request.write(payload);
        }

        request.end();
    });
}
