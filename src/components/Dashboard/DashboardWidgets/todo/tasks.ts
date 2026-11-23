import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { PICKER_DATE_FORMAT } from '#/components/Widgets/values';
import { getLocale } from '#/paraglide/runtime';

import { formatDate } from '#/lib/date-format';

import type {
    StoredWidgetValues,
    WidgetField,
} from '#/components/Widgets/types';
import type { DateFormat } from '#/lib/date-format';
import type { WidgetRecord } from '#/lib/widget-records';
import type { Dayjs } from 'dayjs';

dayjs.extend(isoWeek);

export const taskCollection = 'tasks';

export const t = createWidgetMessages({
    en: {
        label: 'To-do list',
        description:
            'Tasks with a deadline, grouped by when they are due. Overdue tasks come first.',
        show_done: 'Show completed tasks',
        add_task: 'Add task',
        new_task: 'New task',
        edit_task: 'Edit task',
        save_task: 'Save task',
        delete_task: 'Delete task',
        title: 'Task',
        title_placeholder: 'What needs doing',
        scope: 'Deadline',
        scope_hint: 'Due by the end of the chosen day, week or month',
        scope_day: 'Day',
        scope_week: 'Week',
        scope_month: 'Month',
        date: 'Due date',
        date_hint: 'The day, week or month the task is due in',
        repeat: 'Repeat',
        repeat_none: 'Does not repeat',
        repeat_daily: 'Daily',
        repeat_weekly: 'Weekly',
        repeat_monthly: 'Monthly',
        repeat_yearly: 'Yearly',
        times: 'Times to complete',
        times_hint: 'How often the task has to be done before its deadline',
        section_overdue: 'Overdue',
        section_today: 'Today',
        section_week: 'This week',
        section_month: 'This month',
        section_year: 'This year',
        section_later: 'Later',
        section_done: 'Done',
        empty: 'No tasks yet.',
        week: 'Week',
        mark_done: 'Mark one as done',
        undo: 'Undo',
        options: 'Task options',
    },
    de: {
        label: 'Aufgabenliste',
        description:
            'Aufgaben mit Frist, gruppiert nach Fälligkeit. Überfällige Aufgaben stehen oben.',
        show_done: 'Erledigte Aufgaben anzeigen',
        add_task: 'Aufgabe hinzufügen',
        new_task: 'Neue Aufgabe',
        edit_task: 'Aufgabe bearbeiten',
        save_task: 'Aufgabe speichern',
        delete_task: 'Aufgabe löschen',
        title: 'Aufgabe',
        title_placeholder: 'Was zu tun ist',
        scope: 'Frist',
        scope_hint:
            'Fällig bis zum Ende des gewählten Tages, der Woche oder des Monats',
        scope_day: 'Tag',
        scope_week: 'Woche',
        scope_month: 'Monat',
        date: 'Fällig am',
        date_hint:
            'Der Tag, die Woche oder der Monat, in dem die Aufgabe fällig ist',
        repeat: 'Wiederholung',
        repeat_none: 'Keine Wiederholung',
        repeat_daily: 'Täglich',
        repeat_weekly: 'Wöchentlich',
        repeat_monthly: 'Monatlich',
        repeat_yearly: 'Jährlich',
        times: 'Zu erledigen',
        times_hint: 'Wie oft die Aufgabe vor ihrer Frist erledigt werden muss',
        section_overdue: 'Überfällig',
        section_today: 'Heute',
        section_week: 'Diese Woche',
        section_month: 'Dieser Monat',
        section_year: 'Dieses Jahr',
        section_later: 'Später',
        section_done: 'Erledigt',
        empty: 'Noch keine Aufgaben.',
        week: 'KW',
        mark_done: 'Einmal als erledigt markieren',
        undo: 'Rückgängig',
        options: 'Aufgabenoptionen',
    },
});

export type TaskScope = 'day' | 'week' | 'month';

export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
    id: string;
    title: string;
    scope: TaskScope;
    date: string;
    repeat: TaskRepeat;
    timesRequired: number;
    timesDone: number;
    doneAt: string | null;
    dueAt: Dayjs;
}

export type TaskSection =
    'overdue' | 'today' | 'week' | 'month' | 'year' | 'later' | 'done';

export const taskSections: ReadonlyArray<TaskSection> = [
    'overdue',
    'today',
    'week',
    'month',
    'year',
    'later',
    'done',
];

const scopes: ReadonlyArray<TaskScope> = ['day', 'week', 'month'];

const repeats: ReadonlyArray<TaskRepeat> = [
    'none',
    'daily',
    'weekly',
    'monthly',
    'yearly',
];

const repeatUnits: Record<
    Exclude<TaskRepeat, 'none'>,
    'day' | 'week' | 'month' | 'year'
> = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
    yearly: 'year',
};

export const taskFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'title',
        label: () => t('title'),
        placeholder: () => t('title_placeholder'),
        required: true,
        maxLength: 160,
    },
    {
        kind: 'select',
        name: 'scope',
        label: () => t('scope'),
        description: () => t('scope_hint'),
        defaultValue: 'day',
        options: () => [
            { value: 'day', label: t('scope_day') },
            { value: 'week', label: t('scope_week') },
            { value: 'month', label: t('scope_month') },
        ],
    },
    {
        kind: 'date',
        name: 'date',
        label: () => t('date'),
        description: () => t('date_hint'),
        required: true,
    },
    {
        kind: 'select',
        name: 'repeat',
        label: () => t('repeat'),
        defaultValue: 'none',
        options: () => [
            { value: 'none', label: t('repeat_none') },
            { value: 'daily', label: t('repeat_daily') },
            { value: 'weekly', label: t('repeat_weekly') },
            { value: 'monthly', label: t('repeat_monthly') },
            { value: 'yearly', label: t('repeat_yearly') },
        ],
    },
    {
        kind: 'number',
        name: 'timesRequired',
        label: () => t('times'),
        description: () => t('times_hint'),
        defaultValue: 1,
        min: 1,
        max: 99,
        step: 1,
        required: true,
    },
];

export function dueAt(scope: TaskScope, date: string): Dayjs {
    const day = dayjs(date);
    const anchor = day.isValid() ? day : dayjs();

    switch (scope) {
        case 'day':
            return anchor.endOf('day');
        case 'week':
            return anchor.endOf('isoWeek');
        case 'month':
            return anchor.endOf('month');
    }
}

export function asScope(value: unknown): TaskScope {
    return scopes.find((scope) => scope === value) ?? 'day';
}

export function asRepeat(value: unknown): TaskRepeat {
    return repeats.find((repeat) => repeat === value) ?? 'none';
}

export function decodeTask(record: WidgetRecord): Task {
    const { data } = record;

    const scope = asScope(data.scope);
    const repeat = asRepeat(data.repeat);
    const date =
        typeof data.date === 'string' && dayjs(data.date).isValid()
            ? dayjs(data.date).format(PICKER_DATE_FORMAT)
            : dayjs().format(PICKER_DATE_FORMAT);

    const timesRequired =
        typeof data.timesRequired === 'number' && data.timesRequired >= 1
            ? Math.floor(data.timesRequired)
            : 1;

    const timesDone =
        typeof data.timesDone === 'number' && data.timesDone > 0
            ? Math.min(Math.floor(data.timesDone), timesRequired)
            : 0;

    return {
        id: record.id,
        title: typeof data.title === 'string' ? data.title : '',
        scope,
        date,
        repeat,
        timesRequired,
        timesDone,
        doneAt: typeof data.doneAt === 'string' ? data.doneAt : null,
        dueAt: dueAt(scope, date),
    };
}

export function encodeTask(task: {
    title: string;
    scope: TaskScope;
    date: string;
    repeat: TaskRepeat;
    timesRequired: number;
    timesDone: number;
    doneAt: string | null;
}): StoredWidgetValues {
    return {
        title: task.title,
        scope: task.scope,
        date: task.date,
        repeat: task.repeat,
        timesRequired: task.timesRequired,
        timesDone: task.timesDone,
        doneAt: task.doneAt,
    };
}

export function taskSortKey(values: StoredWidgetValues): string {
    return dueAt(
        asScope(values.scope),
        typeof values.date === 'string' ? values.date : ''
    ).toISOString();
}

export function sectionOf(task: Task, now: Dayjs): TaskSection {
    if (task.doneAt) return 'done';
    if (task.dueAt.isBefore(now)) return 'overdue';
    if (!task.dueAt.isAfter(now.endOf('day'))) return 'today';
    if (!task.dueAt.isAfter(now.endOf('isoWeek'))) return 'week';
    if (!task.dueAt.isAfter(now.endOf('month'))) return 'month';
    if (!task.dueAt.isAfter(now.endOf('year'))) return 'year';

    return 'later';
}

export function sectionLabel(section: TaskSection): string {
    switch (section) {
        case 'overdue':
            return t('section_overdue');
        case 'today':
            return t('section_today');
        case 'week':
            return t('section_week');
        case 'month':
            return t('section_month');
        case 'year':
            return t('section_year');
        case 'later':
            return t('section_later');
        case 'done':
            return t('section_done');
    }
}

export function nextOccurrence(task: Task, now: Dayjs): string {
    if (task.repeat === 'none') return task.date;

    const unit = repeatUnits[task.repeat];
    const current = dueAt(task.scope, now.format(PICKER_DATE_FORMAT));
    let candidate = dayjs(task.date).add(1, unit);

    while (
        !dueAt(task.scope, candidate.format(PICKER_DATE_FORMAT)).isAfter(
            current
        )
    ) {
        candidate = candidate.add(1, unit);
    }

    return candidate.format(PICKER_DATE_FORMAT);
}

export function completeOnce(task: Task, now: Dayjs): StoredWidgetValues {
    const timesDone = task.timesDone + 1;

    if (timesDone < task.timesRequired) {
        return encodeTask({ ...task, timesDone });
    }

    if (task.repeat === 'none') {
        return encodeTask({
            ...task,
            timesDone: task.timesRequired,
            doneAt: now.toISOString(),
        });
    }

    return encodeTask({
        ...task,
        date: nextOccurrence(task, now),
        timesDone: 0,
        doneAt: null,
    });
}

export function undoOnce(task: Task): StoredWidgetValues {
    if (task.doneAt) {
        return encodeTask({
            ...task,
            doneAt: null,
            timesDone: Math.max(0, task.timesRequired - 1),
        });
    }

    return encodeTask({ ...task, timesDone: Math.max(0, task.timesDone - 1) });
}

export function dueLabel(task: Task, dateFormat: DateFormat): string {
    const day = dayjs(task.date);

    switch (task.scope) {
        case 'day':
            return formatDate(day.toDate(), dateFormat, {
                monthName: true,
                year: day.year() !== dayjs().year(),
            });
        case 'week':
            return `${t('week')} ${day.isoWeek()}`;
        case 'month':
            return day.toDate().toLocaleDateString(getLocale(), {
                month: 'long',
                year: 'numeric',
            });
    }
}

export function repeatLabel(repeat: TaskRepeat): string | null {
    switch (repeat) {
        case 'none':
            return null;
        case 'daily':
            return t('repeat_daily');
        case 'weekly':
            return t('repeat_weekly');
        case 'monthly':
            return t('repeat_monthly');
        case 'yearly':
            return t('repeat_yearly');
    }
}
