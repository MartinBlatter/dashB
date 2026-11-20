import { useRef, useState } from 'react';
import {
    Group,
    Paper,
    SegmentedControl,
    Stack,
    Text,
    Textarea,
} from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';

import { articleQueryKey, saveArticle } from '#/lib/articles';

import ArticleOutline from './ArticleOutline';
import ArticleRichEditor from './ArticleRichEditor';
import { t } from './i18n';
import { htmlToMarkdown, markdownToHtml } from './markdown';
import { articleHeadings, articleWordCount, headingSelector } from './outline';
import classes from './article.module.css';

import type { Article } from '#/lib/articles';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

const saveDelay = 900;
const outlineDelay = 400;
const markdownDelay = 400;
const markdownRows = 16;

export default function ArticleBody({
    pageId,
    initialContent,
    showOutline,
    readable,
}: {
    pageId: string;
    initialContent: string;
    showOutline: boolean;
    readable: boolean;
}) {
    const queryClient = useQueryClient();
    const [html, setHtml] = useState(initialContent);
    const [markdown, setMarkdown] = useState('');
    const [markdownMode, setMarkdownMode] = useState(false);
    const [revision, setRevision] = useState(0);
    const [status, setStatus] = useState<SaveStatus>('idle');

    const bodyRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef(initialContent);
    const dirtyRef = useRef(false);

    async function persist() {
        if (!dirtyRef.current) return;

        dirtyRef.current = false;

        const content = contentRef.current;

        setStatus('saving');

        try {
            await saveArticle({ data: { pageId, content } });
        } catch {
            dirtyRef.current = true;
            setStatus('failed');
            return;
        }

        setStatus('saved');
        queryClient.setQueryData<Article>(articleQueryKey(pageId), { content });
    }

    const save = useDebouncedCallback(
        () => {
            void persist();
        },
        { delay: saveDelay, flushOnUnmount: true }
    );

    const refreshOutline = useDebouncedCallback(
        (next: string) => setHtml(next),
        { delay: outlineDelay }
    );

    function applyHtml(next: string) {
        contentRef.current = next;
        dirtyRef.current = true;
        save();
        refreshOutline(next);
    }

    const syncMarkdown = useDebouncedCallback(
        (next: string) => applyHtml(markdownToHtml(next)),
        { delay: markdownDelay, flushOnUnmount: true }
    );

    function handleMarkdownChange(next: string) {
        setMarkdown(next);
        syncMarkdown(next);
    }

    function handleModeChange(next: string) {
        if (next === 'markdown') {
            setMarkdown(htmlToMarkdown(contentRef.current));
            setMarkdownMode(true);
            return;
        }

        syncMarkdown.flush();
        setRevision((current) => current + 1);
        setMarkdownMode(false);
    }

    function handleJump(index: number) {
        const heading = bodyRef.current
            ?.querySelectorAll(headingSelector)
            .item(index);

        heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const headings = articleHeadings(html);
    const words = articleWordCount(html);

    const statusMessage =
        status === 'saving'
            ? t('saving')
            : status === 'saved'
              ? t('saved')
              : status === 'failed'
                ? t('save_failed')
                : null;

    return (
        <div className={classes.layout}>
            <div
                ref={bodyRef}
                className={
                    readable
                        ? `${classes.main} ${classes.readable}`
                        : classes.main
                }
            >
                <Stack gap="xs">
                    <Group justify="space-between" gap="sm" wrap="wrap">
                        <SegmentedControl
                            size="xs"
                            value={markdownMode ? 'markdown' : 'rich'}
                            onChange={handleModeChange}
                            aria-label={t('mode')}
                            data={[
                                { value: 'rich', label: t('mode_rich') },
                                {
                                    value: 'markdown',
                                    label: t('mode_markdown'),
                                },
                            ]}
                        />

                        <Group gap="md">
                            <Text size="xs" c="dimmed">
                                {words} {words === 1 ? t('word') : t('words')}
                            </Text>

                            {statusMessage ? (
                                <Text
                                    size="xs"
                                    c={status === 'failed' ? 'red' : 'dimmed'}
                                >
                                    {statusMessage}
                                </Text>
                            ) : null}
                        </Group>
                    </Group>

                    <Paper withBorder radius="md" style={{ overflow: 'clip' }}>
                        {markdownMode ? (
                            <Textarea
                                variant="unstyled"
                                autosize
                                minRows={markdownRows}
                                px="md"
                                py="sm"
                                classNames={{ root: classes.markdown }}
                                aria-label={t('markdown_label')}
                                placeholder={t('markdown_placeholder')}
                                value={markdown}
                                onChange={(event) =>
                                    handleMarkdownChange(
                                        event.currentTarget.value
                                    )
                                }
                                onBlur={() => {
                                    syncMarkdown.flush();
                                    save.flush();
                                }}
                            />
                        ) : (
                            <ArticleRichEditor
                                key={revision}
                                initialContent={contentRef.current}
                                onChange={applyHtml}
                                onBlur={() => save.flush()}
                            />
                        )}
                    </Paper>

                    {markdownMode ? (
                        <Text size="xs" c="dimmed">
                            {t('markdown_hint')}
                        </Text>
                    ) : null}
                </Stack>
            </div>

            {showOutline ? (
                <ArticleOutline headings={headings} onJump={handleJump} />
            ) : null}
        </div>
    );
}
