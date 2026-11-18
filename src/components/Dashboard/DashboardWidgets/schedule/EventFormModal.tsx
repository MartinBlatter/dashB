import { Button, Modal, Stack } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { encodeEvent, eventFields, t } from './schedule';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { NativeEvent } from './schedule';

export default function EventFormModal({
    opened,
    event,
    defaultStart,
    onClose,
    onSubmit,
    onDelete,
}: {
    opened: boolean;
    event: NativeEvent | null;
    defaultStart: string | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
    onDelete?: () => Promise<void>;
}) {
    const initialValues = fromStoredValues(
        eventFields,
        event
            ? encodeEvent(event)
            : defaultStart === null
              ? {}
              : { start: defaultStart }
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={event ? t('edit_event') : t('new_event')}
        >
            <Stack gap="sm">
                <FieldsForm
                    key={event?.id ?? defaultStart ?? 'new'}
                    fields={eventFields}
                    initialValues={initialValues}
                    submitLabel={event ? t('save_event') : t('add_event')}
                    onSubmit={onSubmit}
                />

                {event && onDelete ? (
                    <Button
                        variant="light"
                        color="red"
                        leftSection={<TrashIcon size={14} />}
                        onClick={() => void onDelete()}
                    >
                        {t('delete_event')}
                    </Button>
                ) : null}
            </Stack>
        </Modal>
    );
}
