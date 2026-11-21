import dayjs from 'dayjs';

import { getLocale } from '#/paraglide/runtime';

export function dueText(due: string): string {
    const parsed = dayjs(due);

    return parsed.isValid()
        ? parsed.toDate().toLocaleDateString(getLocale(), {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : due;
}

export function isOverdue(due: string, today: string | null): boolean {
    return today !== null && due !== '' && due < today;
}
