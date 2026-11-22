import { useMemo } from 'react';
import { Anchor, Box, Group, Paper, Stack } from '@mantine/core';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';

import { AnchorLink } from '#/components/AnchorLink/AnchorLink';
import { helpDocs } from '#/lib/help-docs';
import { helpSourceUrl, renderHelpDoc } from '#/lib/help-markdown';
import { m } from '#/paraglide/messages';

import HelpBody from './HelpBody';
import HelpContents from './HelpContents';
import classes from './help.module.css';

import type { HelpDoc } from '#/lib/help-docs';

export default function HelpDocView({
    doc,
    markdown,
}: {
    doc: HelpDoc;
    markdown: string;
}) {
    const { html, headings } = useMemo(
        () => renderHelpDoc(doc, markdown),
        [doc, markdown]
    );

    return (
        <Stack gap="md">
            <Group justify="space-between" gap="sm" align="center">
                <Group gap="md" wrap="wrap">
                    {helpDocs.map((entry) => (
                        <AnchorLink
                            key={entry.slug}
                            to="/help/$doc"
                            params={{ doc: entry.slug }}
                            size="sm"
                            underline="hover"
                            fw={entry.slug === doc.slug ? 600 : 400}
                            c={entry.slug === doc.slug ? undefined : 'dimmed'}
                        >
                            {entry.title}
                        </AnchorLink>
                    ))}
                </Group>

                <Anchor
                    href={helpSourceUrl(doc)}
                    target="_blank"
                    rel="noreferrer noopener"
                    size="sm"
                    c="dimmed"
                >
                    <Group gap={6} wrap="nowrap">
                        <ArrowSquareOutIcon size={14} />
                        {m['help.source']()}
                    </Group>
                </Anchor>
            </Group>

            <Box className={classes.layout}>
                <Paper withBorder radius="md" p="lg" className={classes.main}>
                    <HelpBody html={html} />
                </Paper>

                <HelpContents headings={headings} />
            </Box>
        </Stack>
    );
}
