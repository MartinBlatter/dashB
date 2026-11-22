import { requestJson } from './http.mjs';

function parseSetCookie(header, origin) {
    const [pair, ...rest] = header.split(';');
    const split = pair.indexOf('=');

    if (split < 1) {
        return null;
    }

    const attributes = rest.map((entry) => entry.trim().toLowerCase());
    const sameSiteAttribute = attributes.find((entry) =>
        entry.startsWith('samesite=')
    );
    const sameSiteValue = sameSiteAttribute?.slice('samesite='.length);
    const sameSite =
        sameSiteValue === 'strict'
            ? 'strict'
            : sameSiteValue === 'none'
              ? 'no_restriction'
              : 'lax';

    return {
        url: `${origin}/`,
        name: pair.slice(0, split).trim(),
        value: pair.slice(split + 1).trim(),
        path: '/',
        httpOnly: attributes.includes('httponly'),
        secure: attributes.includes('secure'),
        sameSite,
    };
}

export async function createSession(origin, credentials) {
    const body = {
        email: credentials.email,
        password: credentials.password,
    };

    const signIn = await requestJson(`${origin}/api/auth/sign-in/email`, {
        method: 'POST',
        body,
    });

    if (signIn.status === 200 && signIn.cookies.length > 0) {
        return signIn.cookies;
    }

    const signUp = await requestJson(`${origin}/api/auth/sign-up/email`, {
        method: 'POST',
        body: { ...body, name: credentials.name },
    });

    if (signUp.status === 200 && signUp.cookies.length > 0) {
        return signUp.cookies;
    }

    throw new Error(
        `auto sign-in failed: sign-in ${signIn.status}, sign-up ${signUp.status} ${signUp.text.slice(0, 200)}`
    );
}

export async function applySession(cookieStore, origin, cookies) {
    for (const header of cookies) {
        const cookie = parseSetCookie(header, origin);

        if (cookie !== null) {
            await cookieStore.set(cookie);
        }
    }
}
