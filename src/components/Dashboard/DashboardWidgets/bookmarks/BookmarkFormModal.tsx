import { Modal } from '@mantine/core';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';

import { bookmarkFields, encodeBookmark, t } from './bookmarks';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { Bookmark } from './bookmarks';

export default function BookmarkFormModal({
    opened,
    bookmark,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    bookmark: Bookmark | null;
    onClose: () => void;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}) {
    const initialValues = fromStoredValues(
        bookmarkFields,
        bookmark ? encodeBookmark(bookmark) : {}
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={bookmark ? t('edit_bookmark') : t('new_bookmark')}
        >
            <FieldsForm
                key={bookmark?.id ?? 'new'}
                fields={bookmarkFields}
                initialValues={initialValues}
                submitLabel={bookmark ? t('save_bookmark') : t('add_bookmark')}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}
