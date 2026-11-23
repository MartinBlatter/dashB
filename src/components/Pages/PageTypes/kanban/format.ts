import dayjs from 'dayjs';

import { formatDate } from '#/lib/date-format';

import type { DateFormat } from '#/lib/date-format';

export function dueText(due: string, dateFormat: DateFormat): string {
    const parsed = dayjs(due);

    return parsed.isValid() ? formatDate(parsed.toDate(), dateFormat) : due;
}

export function isOverdue(due: string, today: string | null): boolean {
    return today !== null && due !== '' && due < today;
}
