import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { encodeItem, itemFields, t } from './shopping';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { ShoppingItem } from './shopping';

export default function ItemFormModal({
    opened,
    item,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    item: ShoppingItem | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}) {
    const initialValues = fromStoredValues(
        itemFields,
        item ? encodeItem(item) : {}
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={item ? t('edit_item') : t('new_item')}
        >
            <FieldsForm
                key={item?.id ?? 'new'}
                fields={itemFields}
                initialValues={initialValues}
                submitLabel={item ? t('save_item') : t('add_item')}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}
