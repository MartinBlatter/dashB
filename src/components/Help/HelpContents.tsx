import { Paper, Text } from '@mantine/core';

import { m } from '#/paraglide/messages';

import classes from './help.module.css';

import type { HelpHeading } from '#/lib/help-markdown';

const indentPerLevel = 10;

export default function HelpContents({
    headings,
}: {
    headings: Array<HelpHeading>;
}) {
    if (headings.length === 0) return null;

    return (
        <Paper
            component="nav"
            withBorder
            radius="md"
            p="sm"
            visibleFrom="lg"
            className={classes.outline}
            aria-label={m['help.contents']()}
        >
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
                {m['help.contents']()}
            </Text>

            <ul className={classes.outlineList}>
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a
                            href={`#${heading.id}`}
                            className={classes.outlineLink}
                            style={{
                                paddingLeft:
                                    (heading.level - 1) * indentPerLevel + 8,
                                fontWeight: heading.level <= 2 ? 500 : 400,
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </Paper>
    );
}
