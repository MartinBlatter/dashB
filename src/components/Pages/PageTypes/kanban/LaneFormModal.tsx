import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { t } from './i18n';
import { laneFields } from './kanban';

import type { KanbanLane } from './kanban';
import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { ReactElement } from 'react';

export default function LaneFormModal({
    opened,
    lane,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    lane: KanbanLane | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}): ReactElement {
    const fields = laneFields();

    const initialValues = fromStoredValues(
        fields,
        lane ? { title: lane.title, color: lane.color } : {}
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={lane ? t('edit_lane') : t('new_lane')}
        >
            <FieldsForm
                key={lane?.id ?? 'new'}
                fields={fields}
                initialValues={initialValues}
                submitLabel={lane ? t('save_lane') : t('add_lane')}
                onSubmit={async (values) => {
                    await onSubmit(values);
                    onClose();
                }}
            />
        </Modal>
    );
}
