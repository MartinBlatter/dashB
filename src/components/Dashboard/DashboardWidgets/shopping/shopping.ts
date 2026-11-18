import { createWidgetMessages } from '#/components/Widgets/i18n';

import type {
    StoredWidgetValues,
    WidgetField,
} from '#/components/Widgets/types';
import type { WidgetRecord } from '#/lib/widget-records';

export const itemCollection = 'shopping-items';

export const t = createWidgetMessages({
    en: {
        label: 'Shopping list',
        description:
            'Things to buy, grouped by aisle. Check them off while you shop.',
        group_by_category: 'Group by category',
        show_checked: 'Show items in the cart',
        add_item: 'Add item',
        new_item: 'New item',
        edit_item: 'Edit item',
        save_item: 'Save item',
        delete_item: 'Delete item',
        name: 'Item',
        name_placeholder: 'What to buy',
        quick_add: 'Add an item and press Enter',
        with_details: 'Add with details',
        quantity: 'Amount',
        quantity_hint: 'Leave empty when the amount does not matter',
        unit: 'Unit',
        category: 'Category',
        note: 'Note',
        note_placeholder: 'Brand, size, anything to remember',
        unit_pcs: 'Pieces',
        unit_g: 'Grams',
        unit_kg: 'Kilograms',
        unit_ml: 'Millilitres',
        unit_l: 'Litres',
        unit_pack: 'Packs',
        unit_bottle: 'Bottles',
        short_g: 'g',
        short_kg: 'kg',
        short_ml: 'ml',
        short_l: 'l',
        short_pack: 'pack',
        short_bottle: 'btl',
        cat_produce: 'Fruit & vegetables',
        cat_bakery: 'Bakery',
        cat_dairy: 'Dairy & eggs',
        cat_meat: 'Meat & fish',
        cat_frozen: 'Frozen',
        cat_pantry: 'Pantry',
        cat_drinks: 'Drinks',
        cat_household: 'Household',
        cat_other: 'Other',
        section_checked: 'In the cart',
        in_cart: 'in the cart',
        clear_checked: 'Clear the cart',
        empty: 'The list is empty.',
        check: 'Check off',
        uncheck: 'Put back on the list',
        options: 'Item options',
    },
    de: {
        label: 'Einkaufsliste',
        description:
            'Was zu kaufen ist, nach Bereich gruppiert. Beim Einkaufen abhaken.',
        group_by_category: 'Nach Kategorie gruppieren',
        show_checked: 'Artikel im Wagen anzeigen',
        add_item: 'Artikel hinzufügen',
        new_item: 'Neuer Artikel',
        edit_item: 'Artikel bearbeiten',
        save_item: 'Artikel speichern',
        delete_item: 'Artikel löschen',
        name: 'Artikel',
        name_placeholder: 'Was zu kaufen ist',
        quick_add: 'Artikel eingeben und Enter drücken',
        with_details: 'Mit Details hinzufügen',
        quantity: 'Menge',
        quantity_hint: 'Leer lassen, wenn die Menge keine Rolle spielt',
        unit: 'Einheit',
        category: 'Kategorie',
        note: 'Notiz',
        note_placeholder: 'Marke, Größe, was du nicht vergessen willst',
        unit_pcs: 'Stück',
        unit_g: 'Gramm',
        unit_kg: 'Kilogramm',
        unit_ml: 'Milliliter',
        unit_l: 'Liter',
        unit_pack: 'Packungen',
        unit_bottle: 'Flaschen',
        short_g: 'g',
        short_kg: 'kg',
        short_ml: 'ml',
        short_l: 'l',
        short_pack: 'Pck.',
        short_bottle: 'Fl.',
        cat_produce: 'Obst & Gemüse',
        cat_bakery: 'Backwaren',
        cat_dairy: 'Milchprodukte & Eier',
        cat_meat: 'Fleisch & Fisch',
        cat_frozen: 'Tiefkühl',
        cat_pantry: 'Vorräte',
        cat_drinks: 'Getränke',
        cat_household: 'Haushalt',
        cat_other: 'Sonstiges',
        section_checked: 'Im Wagen',
        in_cart: 'im Wagen',
        clear_checked: 'Wagen leeren',
        empty: 'Die Liste ist leer.',
        check: 'Abhaken',
        uncheck: 'Zurück auf die Liste',
        options: 'Artikeloptionen',
    },
});

export type ItemCategory =
    | 'produce'
    | 'bakery'
    | 'dairy'
    | 'meat'
    | 'frozen'
    | 'pantry'
    | 'drinks'
    | 'household'
    | 'other';

export type ItemUnit = 'pcs' | 'g' | 'kg' | 'ml' | 'l' | 'pack' | 'bottle';

export interface ShoppingItem {
    id: string;
    name: string;
    quantity: number | null;
    unit: ItemUnit;
    category: ItemCategory;
    note: string;
    checkedAt: string | null;
}

export const itemCategories: ReadonlyArray<ItemCategory> = [
    'produce',
    'bakery',
    'dairy',
    'meat',
    'frozen',
    'pantry',
    'drinks',
    'household',
    'other',
];

const units: ReadonlyArray<ItemUnit> = [
    'pcs',
    'g',
    'kg',
    'ml',
    'l',
    'pack',
    'bottle',
];

export function categoryLabel(category: ItemCategory): string {
    switch (category) {
        case 'produce':
            return t('cat_produce');
        case 'bakery':
            return t('cat_bakery');
        case 'dairy':
            return t('cat_dairy');
        case 'meat':
            return t('cat_meat');
        case 'frozen':
            return t('cat_frozen');
        case 'pantry':
            return t('cat_pantry');
        case 'drinks':
            return t('cat_drinks');
        case 'household':
            return t('cat_household');
        case 'other':
            return t('cat_other');
    }
}

export function unitLabel(unit: ItemUnit): string {
    switch (unit) {
        case 'pcs':
            return t('unit_pcs');
        case 'g':
            return t('unit_g');
        case 'kg':
            return t('unit_kg');
        case 'ml':
            return t('unit_ml');
        case 'l':
            return t('unit_l');
        case 'pack':
            return t('unit_pack');
        case 'bottle':
            return t('unit_bottle');
    }
}

function shortUnitLabel(unit: ItemUnit): string | null {
    switch (unit) {
        case 'pcs':
            return null;
        case 'g':
            return t('short_g');
        case 'kg':
            return t('short_kg');
        case 'ml':
            return t('short_ml');
        case 'l':
            return t('short_l');
        case 'pack':
            return t('short_pack');
        case 'bottle':
            return t('short_bottle');
    }
}

export function quantityLabel(item: ShoppingItem): string | null {
    if (item.quantity === null) return null;

    const short = shortUnitLabel(item.unit);

    return short === null ? `×${item.quantity}` : `${item.quantity} ${short}`;
}

export const itemFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'name',
        label: () => t('name'),
        placeholder: () => t('name_placeholder'),
        required: true,
        maxLength: 120,
    },
    {
        kind: 'number',
        name: 'quantity',
        label: () => t('quantity'),
        description: () => t('quantity_hint'),
        min: 0.01,
        max: 9999,
        step: 1,
    },
    {
        kind: 'select',
        name: 'unit',
        label: () => t('unit'),
        defaultValue: 'pcs',
        options: () =>
            units.map((unit) => ({ value: unit, label: unitLabel(unit) })),
    },
    {
        kind: 'select',
        name: 'category',
        label: () => t('category'),
        defaultValue: 'other',
        options: () =>
            itemCategories.map((category) => ({
                value: category,
                label: categoryLabel(category),
            })),
    },
    {
        kind: 'textarea',
        name: 'note',
        label: () => t('note'),
        placeholder: () => t('note_placeholder'),
        maxLength: 200,
        rows: 2,
    },
];

export function asCategory(value: unknown): ItemCategory {
    return itemCategories.find((category) => category === value) ?? 'other';
}

export function asUnit(value: unknown): ItemUnit {
    return units.find((unit) => unit === value) ?? 'pcs';
}

export function decodeItem(record: WidgetRecord): ShoppingItem {
    const { data } = record;

    const quantity =
        typeof data.quantity === 'number' &&
        Number.isFinite(data.quantity) &&
        data.quantity > 0
            ? data.quantity
            : null;

    return {
        id: record.id,
        name: typeof data.name === 'string' ? data.name : '',
        quantity,
        unit: asUnit(data.unit),
        category: asCategory(data.category),
        note: typeof data.note === 'string' ? data.note : '',
        checkedAt: typeof data.checkedAt === 'string' ? data.checkedAt : null,
    };
}

export function encodeItem(item: {
    name: string;
    quantity: number | null;
    unit: ItemUnit;
    category: ItemCategory;
    note: string;
    checkedAt: string | null;
}): StoredWidgetValues {
    return {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        note: item.note,
        checkedAt: item.checkedAt,
    };
}

export function itemSortKey(values: StoredWidgetValues): string {
    const index = itemCategories.indexOf(asCategory(values.category));
    const name = typeof values.name === 'string' ? values.name : '';

    return `${String(index).padStart(2, '0')}:${name.toLocaleLowerCase()}`;
}

export function toggleItem(item: ShoppingItem, now: Date): StoredWidgetValues {
    return encodeItem({
        ...item,
        checkedAt: item.checkedAt === null ? now.toISOString() : null,
    });
}

export function groupByCategory(
    items: ReadonlyArray<ShoppingItem>
): Array<[ItemCategory, Array<ShoppingItem>]> {
    const grouped = new Map<ItemCategory, Array<ShoppingItem>>();

    for (const item of items) {
        const bucket = grouped.get(item.category);

        if (bucket) bucket.push(item);
        else grouped.set(item.category, [item]);
    }

    return itemCategories
        .filter((category) => grouped.has(category))
        .map((category) => [category, grouped.get(category) ?? []]);
}
