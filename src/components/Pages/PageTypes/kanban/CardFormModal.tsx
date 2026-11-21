import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { t } from './i18n';
import { cardFields } from './kanban';

import type { KanbanCard } from './kanban';
import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { ReactElement } from 'react';

export default function CardFormModal({
    opened,
    card,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    card: KanbanCard | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}): ReactElement {
    const fields = cardFields();

    const initialValues = fromStoredValues(
        fields,
        card
            ? {
                  title: card.title,
                  notes: card.notes,
                  due: card.due === '' ? null : card.due,
                  color: card.color,
              }
            : {}
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={card ? t('edit_card') : t('new_card')}
        >
            <FieldsForm
                key={card?.id ?? 'new'}
                fields={fields}
                initialValues={initialValues}
                submitLabel={card ? t('save_card') : t('add_card')}
                onSubmit={async (values) => {
                    await onSubmit(values);
                    onClose();
                }}
            />
        </Modal>
    );
}
