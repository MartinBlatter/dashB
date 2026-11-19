import { createWidgetMessages } from '#/components/Widgets/i18n';

export const t = createWidgetMessages({
    en: {
        label: 'Article',
        description:
            'One long, structured document with headings, text and images, like a wiki article.',
        toc: 'Show table of contents',
        toc_hint: 'A sidebar built from the headings in the article.',
        width: 'Content width',
        width_readable: 'Readable',
        width_full: 'Full width',
        outline: 'On this page',
        outline_empty: 'Add a heading to build the table of contents.',
        outline_jump: 'Jump to this heading',
        mode: 'Editing mode',
        mode_rich: 'Rich text',
        mode_markdown: 'Markdown',
        markdown_label: 'Article as Markdown',
        markdown_placeholder: '## A heading\n\nSome text.',
        markdown_hint:
            'Markdown is converted to the article as you type. Anything Markdown cannot express is dropped.',
        word: 'word',
        words: 'words',
        saving: 'Saving…',
        saved: 'Saved',
        save_failed: 'Changes could not be saved.',
        image_too_large: 'That image is too large to store in an article.',
        image_failed: 'That image could not be added.',
    },
    de: {
        label: 'Artikel',
        description:
            'Ein langes, strukturiertes Dokument mit Überschriften, Text und Bildern, wie ein Wiki-Artikel.',
        toc: 'Inhaltsverzeichnis anzeigen',
        toc_hint: 'Eine Seitenleiste aus den Überschriften des Artikels.',
        width: 'Inhaltsbreite',
        width_readable: 'Lesbar',
        width_full: 'Volle Breite',
        outline: 'Auf dieser Seite',
        outline_empty:
            'Füge eine Überschrift hinzu, um das Inhaltsverzeichnis aufzubauen.',
        outline_jump: 'Zu dieser Überschrift springen',
        mode: 'Bearbeitungsmodus',
        mode_rich: 'Formatiert',
        mode_markdown: 'Markdown',
        markdown_label: 'Artikel als Markdown',
        markdown_placeholder: '## Eine Überschrift\n\nEtwas Text.',
        markdown_hint:
            'Markdown wird beim Tippen in den Artikel übernommen. Was Markdown nicht ausdrücken kann, geht verloren.',
        word: 'Wort',
        words: 'Wörter',
        saving: 'Wird gespeichert…',
        saved: 'Gespeichert',
        save_failed: 'Änderungen konnten nicht gespeichert werden.',
        image_too_large:
            'Dieses Bild ist zu groß, um in einem Artikel gespeichert zu werden.',
        image_failed: 'Dieses Bild konnte nicht hinzugefügt werden.',
    },
});
