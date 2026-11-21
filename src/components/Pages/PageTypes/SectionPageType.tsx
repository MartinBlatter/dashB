import {
    Card,
    Group,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
} from '@mantine/core';
import {
    FileDashedIcon,
    FileIcon,
    FolderOpenIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { valueText } from '#/components/Widgets/values';
import { pagePath, usePageList, usePagesPending } from '#/lib/pages';
import { m } from '#/paraglide/messages';

import { getPageType } from './registry';

import classes from './section/section.module.css';

import type { PageTypeMeta, PageTypeProps } from './types';
import type { PageNode } from '#/lib/pages';
import type { ReactElement } from 'react';

const t = createWidgetMessages({
    en: {
        label: 'Section',
        description: 'An index of the pages below this one, as cards.',
        columns: 'Columns',
        untyped: 'Show pages without a type',
        untyped_hint: 'Pages you have not picked a type for yet.',
        counts: 'Show how many pages each one contains',
        empty: 'This page has no pages below it yet. Add one in the sidebar and it shows up here.',
        empty_untyped:
            'Every page below this one still has no type. Turn on "Show pages without a type" to list them here.',
        no_type: 'No type yet',
        contains: '{count} pages',
        contains_one: '1 page',
    },
    de: {
        label: 'Bereich',
        description:
            'Ein Verzeichnis der Seiten unter dieser Seite, als Karten.',
        columns: 'Spalten',
        untyped: 'Seiten ohne Typ anzeigen',
        untyped_hint: 'Seiten, für die du noch keinen Typ gewählt hast.',
        counts: 'Anzahl enthaltener Seiten anzeigen',
        empty: 'Unter dieser Seite liegen noch keine Seiten. Füge in der Seitenleiste eine hinzu, dann erscheint sie hier.',
        empty_untyped:
            'Alle Seiten unter dieser Seite haben noch keinen Typ. Aktiviere „Seiten ohne Typ anzeigen“, um sie hier zu listen.',
        no_type: 'Noch kein Typ',
        contains: '{count} Seiten',
        contains_one: '1 Seite',
    },
});

const iconSize = 20;

export const widgetMeta = {
    type: 'section',
    label: () => t('label'),
    description: () => t('description'),
    icon: FolderOpenIcon,
    fields: [
        {
            kind: 'select',
            name: 'columns',
            label: () => t('columns'),
            defaultValue: '3',
            options: () => [
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
            ],
        },
        {
            kind: 'switch',
            name: 'showUntyped',
            label: () => t('untyped'),
            description: () => t('untyped_hint'),
            defaultValue: true,
        },
        {
            kind: 'switch',
            name: 'showCounts',
            label: () => t('counts'),
            defaultValue: true,
        },
    ],
} satisfies PageTypeMeta;

function ChildIcon({ type }: { type: string | null }): ReactElement {
    if (type === null) {
        return (
            <ThemeIcon variant="default" size="lg" radius="md">
                <FileDashedIcon size={iconSize} opacity={0.5} aria-hidden />
            </ThemeIcon>
        );
    }

    const definition = getPageType(type);

    if (!definition) {
        return (
            <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                <WarningIcon
                    size={iconSize}
                    role="img"
                    aria-label={m['page.unknown_type']({ type })}
                />
            </ThemeIcon>
        );
    }

    const Icon = definition.icon ?? FileIcon;

    return (
        <ThemeIcon variant="light" size="lg" radius="md">
            <Icon size={iconSize} aria-hidden />
        </ThemeIcon>
    );
}

function typeLabel(type: string | null): string {
    if (type === null) return t('no_type');

    const definition = getPageType(type);

    return definition ? definition.label() : m['page.unknown_type']({ type });
}

function countLabel(count: number): string {
    return count === 1
        ? t('contains_one')
        : t('contains').replace('{count}', String(count));
}

export default function SectionPageType({
    pageId,
    config,
}: PageTypeProps): ReactElement {
    const pages = usePageList();
    const pending = usePagesPending();

    const columns = Number(valueText(config, 'columns')) || 3;
    const showUntyped = config.showUntyped !== false;
    const showCounts = config.showCounts !== false;

    if (pending) {
        return (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: columns }} spacing="md">
                {[0, 1, 2].map((key) => (
                    <Skeleton key={key} height={96} radius="md" />
                ))}
            </SimpleGrid>
        );
    }

    const all = pages
        .filter((page) => page.parentId === pageId)
        .sort(
            (left, right) =>
                left.position - right.position ||
                left.title.localeCompare(right.title)
        );

    const children = showUntyped
        ? all
        : all.filter((page) => page.type !== null);

    if (children.length === 0) {
        return (
            <Text size="sm" c="dimmed">
                {all.length === 0 ? t('empty') : t('empty_untyped')}
            </Text>
        );
    }

    const childCount = (page: PageNode): number =>
        pages.filter((candidate) => candidate.parentId === page.id).length;

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: columns }} spacing="md">
            {children.map((child) => {
                const count = childCount(child);

                return (
                    <Card
                        key={child.id}
                        withBorder
                        radius="md"
                        padding="md"
                        className={classes.card}
                        renderRoot={(props) => (
                            <Link
                                to="/$"
                                params={{
                                    _splat: pagePath(pages, child.id).slice(1),
                                }}
                                {...props}
                            />
                        )}
                    >
                        <Group gap="sm" wrap="nowrap" align="flex-start">
                            <ChildIcon type={child.type} />

                            <Stack gap={2} style={{ minWidth: 0 }}>
                                <Text fw={500} truncate>
                                    {child.title}
                                </Text>

                                <Text size="xs" c="dimmed" truncate>
                                    {typeLabel(child.type)}
                                </Text>

                                {showCounts && count > 0 ? (
                                    <Text size="xs" c="dimmed">
                                        {countLabel(count)}
                                    </Text>
                                ) : null}
                            </Stack>
                        </Group>
                    </Card>
                );
            })}
        </SimpleGrid>
    );
}
