import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { fieldsFromColumns, sanitizeEntryData } from './columns';
import { t } from './i18n';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { TableColumn, TableEntry } from '#/lib/page-tables';

export default function EntryFormModal({
    opened,
    columns,
    entry,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    columns: ReadonlyArray<TableColumn>;
    entry: TableEntry | null;
    onClose: () => void;
    onSubmit: (data: StoredWidgetValues) => Promise<void>;
}) {
    const fields = fieldsFromColumns(columns);

    const initialValues = fromStoredValues(
        fields,
        entry ? sanitizeEntryData(columns, entry.data) : {}
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={entry ? t('edit_entry') : t('new_entry')}
        >
            <FieldsForm
                key={entry?.id ?? 'new'}
                fields={fields}
                initialValues={initialValues}
                submitLabel={entry ? t('save_entry') : t('add_entry')}
                onSubmit={async (values) => {
                    await onSubmit(values);
                    onClose();
                }}
            />
        </Modal>
    );
}
