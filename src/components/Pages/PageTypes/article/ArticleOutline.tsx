import { Paper, Text, UnstyledButton } from '@mantine/core';

import { t } from './i18n';
import classes from './article.module.css';

import type { ArticleHeading } from './outline';

const indentPerLevel = 10;

export default function ArticleOutline({
    headings,
    onJump,
}: {
    headings: Array<ArticleHeading>;
    onJump: (index: number) => void;
}) {
    return (
        <Paper
            component="nav"
            withBorder
            radius="md"
            p="sm"
            visibleFrom="lg"
            className={classes.outline}
            aria-label={t('outline')}
        >
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
                {t('outline')}
            </Text>

            {headings.length === 0 ? (
                <Text size="xs" c="dimmed">
                    {t('outline_empty')}
                </Text>
            ) : (
                <ul className={classes.outlineList}>
                    {headings.map((heading) => (
                        <li key={heading.index}>
                            <UnstyledButton
                                className={classes.outlineLink}
                                style={{
                                    paddingLeft:
                                        (heading.level - 1) * indentPerLevel +
                                        8,
                                    fontWeight: heading.level <= 2 ? 500 : 400,
                                }}
                                title={t('outline_jump')}
                                onClick={() => onJump(heading.index)}
                            >
                                {heading.text}
                            </UnstyledButton>
                        </li>
                    ))}
                </ul>
            )}
        </Paper>
    );
}
