import { useState } from 'react';
import { Modal, Select, Stack } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';
import {
    asColumnKind,
    joinColumnOptions,
    splitColumnOptions,
} from '#/lib/table-schema';

import { columnFormFields, kindOptions } from './columns';
import { t } from './i18n';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type {
    TableColumn,
    TableColumnDraft,
    TableColumnKind,
} from '#/lib/table-schema';

function textValue(values: StoredWidgetValues, name: string): string {
    const raw = values[name];

    return typeof raw === 'string' ? raw : '';
}

export default function ColumnFormModal({
    opened,
    column,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    column: TableColumn | null;
    onClose: () => void;
    onSubmit: (draft: TableColumnDraft) => Promise<void>;
}) {
    const [draftKind, setDraftKind] = useState<TableColumnKind>('text');

    const kind = column ? column.kind : draftKind;
    const fields = columnFormFields(kind);

    const initialValues = fromStoredValues(
        fields,
        column
            ? {
                  title: column.label,
                  required: column.required,
                  choices: joinColumnOptions(column.options),
              }
            : {}
    );

    function handleClose() {
        setDraftKind('text');
        onClose();
    }

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={column ? t('edit_column') : t('add_column')}
        >
            <Stack gap="sm">
                <Select
                    label={t('column_kind')}
                    description={column ? t('column_kind_locked') : undefined}
                    data={kindOptions()}
                    value={kind}
                    onChange={(value) => setDraftKind(asColumnKind(value))}
                    disabled={column !== null}
                    allowDeselect={false}
                />

                <FieldsForm
                    key={`${column?.id ?? 'new'}-${kind}`}
                    fields={fields}
                    initialValues={initialValues}
                    submitLabel={column ? t('edit_column') : t('add_column')}
                    onSubmit={async (values) => {
                        await onSubmit({
                            label: textValue(values, 'title'),
                            kind,
                            required: values.required === true,
                            options: splitColumnOptions(
                                textValue(values, 'choices')
                            ),
                        });

                        handleClose();
                    }}
                />
            </Stack>
        </Modal>
    );
}
