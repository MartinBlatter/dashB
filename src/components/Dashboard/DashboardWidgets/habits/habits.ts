import dayjs from 'dayjs';

import { createWidgetMessages } from '#/components/Widgets/i18n';

import type {
    StoredWidgetValues,
    WidgetField,
} from '#/components/Widgets/types';
import type { WidgetRecord } from '#/lib/widget-records';

export const habitCollection = 'habits';

export const monthCollection = 'habit-months';

export const t = createWidgetMessages({
    en: {
        label: 'Habits',
        description: 'Daily check-off with streaks.',
        strip_days: 'Days in the strip',
        strip_days_hint: 'How much of the recent history each row shows',
        show_streaks: 'Show streaks',
        name: 'Habit',
        name_placeholder: 'What to do each day',
        target_per_week: 'Days per week',
        target_hint: 'How many days a week you aim for',
        add_habit: 'Add habit',
        new_habit: 'New habit',
        edit_habit: 'Edit habit',
        save_habit: 'Save habit',
        delete_habit: 'Delete habit',
        empty: 'No habits yet.',
        done_today: 'Done today',
        not_done_today: 'Not done today',
        done: 'done',
        missed: 'missed',
        best: 'best',
        days: 'd',
        this_week: 'this week',
        options: 'Habit options',
    },
    de: {
        label: 'Gewohnheiten',
        description: 'Täglich abhaken, mit Serien.',
        strip_days: 'Tage im Streifen',
        strip_days_hint: 'Wie viel Verlauf jede Zeile zeigt',
        show_streaks: 'Serien anzeigen',
        name: 'Gewohnheit',
        name_placeholder: 'Was täglich zu tun ist',
        target_per_week: 'Tage pro Woche',
        target_hint: 'Wie viele Tage pro Woche du anstrebst',
        add_habit: 'Gewohnheit hinzufügen',
        new_habit: 'Neue Gewohnheit',
        edit_habit: 'Gewohnheit bearbeiten',
        save_habit: 'Gewohnheit speichern',
        delete_habit: 'Gewohnheit löschen',
        empty: 'Noch keine Gewohnheiten.',
        done_today: 'Heute erledigt',
        not_done_today: 'Heute nicht erledigt',
        done: 'erledigt',
        missed: 'offen',
        best: 'Bestwert',
        days: 'T',
        this_week: 'diese Woche',
        options: 'Gewohnheits-Optionen',
    },
});

export interface Habit {
    id: string;
    name: string;
    targetPerWeek: number;
}

export interface HabitMonth {
    id: string;
    habitId: string;
    month: string;
    days: Set<string>;
}

export const habitFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'name',
        label: () => t('name'),
        placeholder: () => t('name_placeholder'),
        required: true,
        maxLength: 80,
    },
    {
        kind: 'number',
        name: 'targetPerWeek',
        label: () => t('target_per_week'),
        description: () => t('target_hint'),
        min: 1,
        max: 7,
        step: 1,
        defaultValue: 7,
    },
];

export function dayKey(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD');
}

export function previousDay(day: string): string {
    return dayjs(day).subtract(1, 'day').format('YYYY-MM-DD');
}

export function recentDays(now: Date, count: number): Array<string> {
    const days: Array<string> = [];
    const end = dayjs(now).startOf('day');

    for (let back = count - 1; back >= 0; back--) {
        days.push(end.subtract(back, 'day').format('YYYY-MM-DD'));
    }

    return days;
}

export function monthOf(day: string): string {
    return day.slice(0, 7);
}

export function dayField(day: string): string {
    return `d${day.slice(8, 10)}`;
}

export function monthSortKey(month: string, habitId: string): string {
    return `${month}|${habitId}`;
}

export function decodeHabit(record: WidgetRecord): Habit {
    const { data } = record;

    const target =
        typeof data.targetPerWeek === 'number' &&
        Number.isFinite(data.targetPerWeek)
            ? Math.min(7, Math.max(1, Math.floor(data.targetPerWeek)))
            : 7;

    return {
        id: record.id,
        name: typeof data.name === 'string' ? data.name : '',
        targetPerWeek: target,
    };
}

export function decodeMonth(record: WidgetRecord): HabitMonth {
    const { data } = record;

    const habitId = typeof data.habitId === 'string' ? data.habitId : '';
    const raw = typeof data.month === 'string' ? data.month : '';
    const month = /^\d{4}-\d{2}$/.test(raw) ? raw : '';
    const days = new Set<string>();

    if (month !== '') {
        const parsed = dayjs(`${month}-01`);
        const length = parsed.isValid() ? parsed.daysInMonth() : 0;

        for (let day = 1; day <= length; day++) {
            const suffix = String(day).padStart(2, '0');

            if (data[`d${suffix}`] === true) days.add(`${month}-${suffix}`);
        }
    }

    return { id: record.id, habitId, month, days };
}

export function encodeMonth(
    habitId: string,
    month: string,
    days: ReadonlySet<string>
): StoredWidgetValues {
    const data: StoredWidgetValues = { habitId, month };

    for (const day of days) {
        if (monthOf(day) === month) data[dayField(day)] = true;
    }

    return data;
}

export function doneByHabit(
    months: ReadonlyArray<HabitMonth>
): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();

    for (const entry of months) {
        if (entry.habitId === '' || entry.month === '') continue;

        const bucket = map.get(entry.habitId);

        if (bucket) for (const day of entry.days) bucket.add(day);
        else map.set(entry.habitId, new Set(entry.days));
    }

    return map;
}

export function monthRecordsFor(
    months: ReadonlyArray<HabitMonth>,
    habitId: string,
    month: string
): Array<HabitMonth> {
    return months.filter(
        (entry) => entry.habitId === habitId && entry.month === month
    );
}

export function streakEndingAt(done: ReadonlySet<string>, day: string): number {
    let streak = 0;
    let cursor = day;

    while (done.has(cursor)) {
        streak++;
        cursor = previousDay(cursor);
    }

    return streak;
}

export function currentStreak(
    done: ReadonlySet<string>,
    today: string
): number {
    if (done.has(today)) return streakEndingAt(done, today);

    const yesterday = previousDay(today);

    if (done.has(yesterday)) return streakEndingAt(done, yesterday);

    return 0;
}

export function longestStreak(done: ReadonlySet<string>): number {
    const sorted = [...done].sort();

    let best = 0;
    let run = 0;
    let previous: string | null = null;

    for (const day of sorted) {
        run = previous !== null && previousDay(day) === previous ? run + 1 : 1;

        if (run > best) best = run;

        previous = day;
    }

    return best;
}

export function weekDoneCount(done: ReadonlySet<string>, now: Date): number {
    const start = dayjs(now)
        .startOf('day')
        .subtract((dayjs(now).day() + 6) % 7, 'day');

    let count = 0;

    for (let offset = 0; offset < 7; offset++) {
        if (done.has(start.add(offset, 'day').format('YYYY-MM-DD'))) count++;
    }

    return count;
}
