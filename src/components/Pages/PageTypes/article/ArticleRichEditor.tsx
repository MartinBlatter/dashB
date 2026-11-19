import { useState } from 'react';
import { Text } from '@mantine/core';
import { RichTextEditor, getUploadImageExtension } from '@mantine/tiptap';
import TiptapImage from '@tiptap/extension-image';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import {
    imageTooLargeError,
    toInlineImageUrl,
} from '#/components/Widgets/inlineImage';

import { t } from './i18n';
import classes from './article.module.css';

import type { AnyExtension } from '@tiptap/react';

export default function ArticleRichEditor({
    initialContent,
    onChange,
    onBlur,
}: {
    initialContent: string;
    onChange: (content: string) => void;
    onBlur: () => void;
}) {
    const [imageError, setImageError] = useState<string | null>(null);

    const editor = useEditor({
        immediatelyRender: false,
        content: initialContent,
        extensions: [
            StarterKit.configure({ link: { openOnClick: false } }),
            getUploadImageExtension(TiptapImage, {
                onImageUpload: async (file: File) => {
                    setImageError(null);

                    return await toInlineImageUrl(file);
                },
                onImageUploadError: (_file: File, error: unknown) => {
                    setImageError(
                        error instanceof Error &&
                            error.message === imageTooLargeError
                            ? t('image_too_large')
                            : t('image_failed')
                    );
                },
            }) as AnyExtension,
        ],
        onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
        onBlur: () => onBlur(),
    });

    return (
        <RichTextEditor
            editor={editor}
            variant="subtle"
            classNames={{ root: classes.editor, content: classes.content }}
        >
            <RichTextEditor.Toolbar
                sticky
                stickyOffset="var(--app-shell-header-offset, 60px)"
            >
                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1 />
                    <RichTextEditor.H2 />
                    <RichTextEditor.H3 />
                    <RichTextEditor.H4 />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.Strikethrough />
                    <RichTextEditor.Code />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.BulletList />
                    <RichTextEditor.OrderedList />
                    <RichTextEditor.Blockquote />
                    <RichTextEditor.CodeBlock />
                    <RichTextEditor.Hr />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link />
                    <RichTextEditor.Unlink />
                    <RichTextEditor.ImageUpload />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Undo />
                    <RichTextEditor.Redo />
                </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            {imageError ? (
                <Text size="xs" c="red" px="xs" pt={4}>
                    {imageError}
                </Text>
            ) : null}

            <RichTextEditor.Content />
        </RichTextEditor>
    );
}
