import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { habitFields, t } from './habits';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { Habit } from './habits';

export default function HabitFormModal({
    opened,
    habit,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    habit: Habit | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}) {
    const initialValues = fromStoredValues(
        habitFields,
        habit ? { name: habit.name, targetPerWeek: habit.targetPerWeek } : {}
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={habit ? t('edit_habit') : t('new_habit')}
        >
            <FieldsForm
                key={habit?.id ?? 'new'}
                fields={habitFields}
                initialValues={initialValues}
                submitLabel={habit ? t('save_habit') : t('add_habit')}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}
