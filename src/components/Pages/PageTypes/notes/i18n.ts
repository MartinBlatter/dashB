import { createWidgetMessages } from '#/components/Widgets/i18n';

export const t = createWidgetMessages({
    en: {
        label: 'Notes',
        description:
            'A board of notes you can drag, resize and write in, with text and images.',
        add: 'Add note',
        new_title: 'New note',
        empty: 'No notes yet. Add one to get started.',
        title_label: 'Note title',
        title_placeholder: 'Untitled',
        drag: 'Drag to move this note',
        menu: 'Options for this note',
        delete: 'Delete note',
        delete_prompt:
            'Delete this note? Its text and images are deleted with it.',
        delete_submit: 'Delete',
        delete_failed: 'The note could not be deleted.',
        cancel: 'Cancel',
        save_failed: 'Changes could not be saved.',
        image_too_large: 'That image is too large to store in a note.',
        image_failed: 'That image could not be added.',
        content_placeholder: 'Write something',
    },
    de: {
        label: 'Notizen',
        description:
            'Eine Pinnwand aus Notizen zum Verschieben, Vergrößern und Beschreiben, mit Text und Bildern.',
        add: 'Notiz hinzufügen',
        new_title: 'Neue Notiz',
        empty: 'Noch keine Notizen. Füge eine hinzu, um zu beginnen.',
        title_label: 'Notiztitel',
        title_placeholder: 'Ohne Titel',
        drag: 'Ziehen, um diese Notiz zu verschieben',
        menu: 'Optionen für diese Notiz',
        delete: 'Notiz löschen',
        delete_prompt:
            'Diese Notiz löschen? Ihr Text und ihre Bilder werden mitgelöscht.',
        delete_submit: 'Löschen',
        delete_failed: 'Die Notiz konnte nicht gelöscht werden.',
        cancel: 'Abbrechen',
        save_failed: 'Änderungen konnten nicht gespeichert werden.',
        image_too_large:
            'Dieses Bild ist zu groß, um in einer Notiz gespeichert zu werden.',
        image_failed: 'Dieses Bild konnte nicht hinzugefügt werden.',
        content_placeholder: 'Schreib etwas',
    },
});
