import dayjs from 'dayjs';
import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import {
    PICKER_DATE_FORMAT,
    fromStoredValues,
} from '#/components/Widgets/values';

import { encodeTask, t, taskFields } from './tasks';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { Task } from './tasks';

export default function TaskFormModal({
    opened,
    task,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    task: Task | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}) {
    const initialValues = fromStoredValues(
        taskFields,
        task ? encodeTask(task) : { date: dayjs().format(PICKER_DATE_FORMAT) }
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={task ? t('edit_task') : t('new_task')}
        >
            <FieldsForm
                key={task?.id ?? 'new'}
                fields={taskFields}
                initialValues={initialValues}
                submitLabel={task ? t('save_task') : t('add_task')}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}
