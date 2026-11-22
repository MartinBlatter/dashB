import { useRouter } from '@tanstack/react-router';

import classes from './help.module.css';

import type { MouseEvent } from 'react';

export default function HelpBody({ html }: { html: string }) {
    const router = useRouter();

    function handleClick(event: MouseEvent<HTMLDivElement>) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        if (!(event.target instanceof HTMLElement)) return;

        const href = event.target.closest('a')?.getAttribute('href');

        if (href === null || href === undefined || !href.startsWith('/')) {
            return;
        }

        event.preventDefault();
        void router.navigate({ href });
    }

    return (
        <div
            className={classes.prose}
            onClick={handleClick}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
