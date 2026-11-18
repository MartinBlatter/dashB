import dayjs from 'dayjs';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { getLocale } from '#/paraglide/runtime';

import type {
    StoredWidgetValues,
    WidgetField,
} from '#/components/Widgets/types';
import type { WidgetRecord } from '#/lib/widget-records';

export const expenseCollection = 'expenses';

export const t = createWidgetMessages({
    en: {
        label: 'Expenses',
        description: 'What you spent, this month against the months before.',
        currency: 'Currency',
        currency_hint: 'A three-letter code such as EUR, CHF or USD',
        months_shown: 'Months in the trend',
        show_chart: 'Show the trend',
        amount: 'Amount',
        category: 'Category',
        note: 'Note',
        note_placeholder: 'What it was for',
        day: 'Date',
        add_entry: 'Add expense',
        new_entry: 'New expense',
        edit_entry: 'Edit expense',
        save_entry: 'Save expense',
        delete_entry: 'Delete expense',
        this_month: 'This month',
        empty: 'Nothing recorded yet.',
        options: 'Expense options',
        cat_food: 'Food & drink',
        cat_transport: 'Transport',
        cat_home: 'Home & bills',
        cat_health: 'Health',
        cat_fun: 'Leisure',
        cat_other: 'Other',
    },
    de: {
        label: 'Ausgaben',
        description: 'Was du ausgegeben hast, dieser Monat gegen die vorigen.',
        currency: 'Währung',
        currency_hint: 'Ein dreistelliger Code wie EUR, CHF oder USD',
        months_shown: 'Monate im Verlauf',
        show_chart: 'Verlauf anzeigen',
        amount: 'Betrag',
        category: 'Kategorie',
        note: 'Notiz',
        note_placeholder: 'Wofür es war',
        day: 'Datum',
        add_entry: 'Ausgabe hinzufügen',
        new_entry: 'Neue Ausgabe',
        edit_entry: 'Ausgabe bearbeiten',
        save_entry: 'Ausgabe speichern',
        delete_entry: 'Ausgabe löschen',
        this_month: 'Dieser Monat',
        empty: 'Noch nichts erfasst.',
        options: 'Ausgaben-Optionen',
        cat_food: 'Essen & Trinken',
        cat_transport: 'Verkehr',
        cat_home: 'Wohnen & Rechnungen',
        cat_health: 'Gesundheit',
        cat_fun: 'Freizeit',
        cat_other: 'Sonstiges',
    },
});

export type ExpenseCategory =
    'food' | 'transport' | 'home' | 'health' | 'fun' | 'other';

export const expenseCategories: ReadonlyArray<ExpenseCategory> = [
    'food',
    'transport',
    'home',
    'health',
    'fun',
    'other',
];

export interface Expense {
    id: string;
    amount: number;
    category: ExpenseCategory;
    note: string;
    day: string;
}

export function categoryLabel(category: ExpenseCategory): string {
    switch (category) {
        case 'food':
            return t('cat_food');
        case 'transport':
            return t('cat_transport');
        case 'home':
            return t('cat_home');
        case 'health':
            return t('cat_health');
        case 'fun':
            return t('cat_fun');
        case 'other':
            return t('cat_other');
    }
}

export function asCategory(value: unknown): ExpenseCategory {
    return expenseCategories.find((category) => category === value) ?? 'other';
}

export const expenseFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'number',
        name: 'amount',
        label: () => t('amount'),
        required: true,
        min: 0.01,
        max: 99999999,
        step: 1,
    },
    {
        kind: 'select',
        name: 'category',
        label: () => t('category'),
        defaultValue: 'other',
        options: () =>
            expenseCategories.map((category) => ({
                value: category,
                label: categoryLabel(category),
            })),
    },
    {
        kind: 'date',
        name: 'day',
        label: () => t('day'),
        required: true,
    },
    {
        kind: 'text',
        name: 'note',
        label: () => t('note'),
        placeholder: () => t('note_placeholder'),
        maxLength: 120,
    },
];

export function decodeExpense(record: WidgetRecord): Expense {
    const { data } = record;

    const amount =
        typeof data.amount === 'number' && Number.isFinite(data.amount)
            ? data.amount
            : 0;

    const day =
        typeof data.day === 'string' && dayjs(data.day).isValid()
            ? dayjs(data.day).format('YYYY-MM-DD')
            : '';

    return {
        id: record.id,
        amount,
        category: asCategory(data.category),
        note: typeof data.note === 'string' ? data.note : '',
        day,
    };
}

export function encodeExpense(expense: {
    amount: number;
    category: ExpenseCategory;
    note: string;
    day: string;
}): StoredWidgetValues {
    return {
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        day: expense.day,
    };
}

export function expenseSortKey(values: StoredWidgetValues): string {
    return typeof values.day === 'string' ? values.day : '';
}

export function todayKey(now: Date): string {
    return dayjs(now).format('YYYY-MM-DD');
}

export function monthKeyOf(day: string): string {
    return day.slice(0, 7);
}

export function formatAmount(value: number, currency: string): string {
    const locale = getLocale();
    const code = currency.trim().toUpperCase();

    if (/^[A-Z]{3}$/.test(code)) {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: code,
                maximumFractionDigits: 2,
            }).format(value);
        } catch {
            return new Intl.NumberFormat(locale, {
                maximumFractionDigits: 2,
            }).format(value);
        }
    }

    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
    }).format(value);
}

export interface MonthTotal {
    key: string;
    label: string;
    value: number;
}

export function monthTotals(
    expenses: ReadonlyArray<Expense>,
    now: Date,
    months: number
): Array<MonthTotal> {
    const sums = new Map<string, number>();

    for (const expense of expenses) {
        if (expense.day === '') continue;

        const key = monthKeyOf(expense.day);

        sums.set(key, (sums.get(key) ?? 0) + expense.amount);
    }

    const locale = getLocale();
    const out: Array<MonthTotal> = [];

    for (let back = months - 1; back >= 0; back--) {
        const point = dayjs(now).startOf('month').subtract(back, 'month');
        const key = point.format('YYYY-MM');

        out.push({
            key,
            label: point.toDate().toLocaleDateString(locale, {
                month: 'short',
                year: '2-digit',
            }),
            value: sums.get(key) ?? 0,
        });
    }

    return out;
}

export function monthSum(
    expenses: ReadonlyArray<Expense>,
    monthKey: string
): number {
    let total = 0;

    for (const expense of expenses) {
        if (expense.day !== '' && monthKeyOf(expense.day) === monthKey) {
            total += expense.amount;
        }
    }

    return total;
}
