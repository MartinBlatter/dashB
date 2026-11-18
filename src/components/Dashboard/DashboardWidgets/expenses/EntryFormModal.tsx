import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { encodeExpense, expenseFields, t, todayKey } from './expenses';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { Expense } from './expenses';

export default function EntryFormModal({
    opened,
    entry,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    entry: Expense | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}) {
    const initialValues = fromStoredValues(
        expenseFields,
        entry ? encodeExpense(entry) : { day: todayKey(new Date()) }
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={entry ? t('edit_entry') : t('new_entry')}
        >
            <FieldsForm
                key={entry?.id ?? 'new'}
                fields={expenseFields}
                initialValues={initialValues}
                submitLabel={entry ? t('save_entry') : t('add_entry')}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}
