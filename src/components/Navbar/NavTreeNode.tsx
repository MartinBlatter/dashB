import { ActionIcon, Box, Collapse, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    CaretRightIcon,
    FileDashedIcon,
    FileIcon,
    PencilSimpleIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { getPageType } from '#/components/Pages/PageTypes/registry';
import { pagePath } from '#/lib/pages';
import { m } from '#/paraglide/messages';

import { usePageEditMode } from './edit-mode';

import type { PageNode, PageTreeNode } from '#/lib/pages';
import type { ReactElement } from 'react';

const iconSize = 16;

function PageTypeIcon({ type }: { type: string | null }): ReactElement {
    if (type === null) {
        return <FileDashedIcon size={iconSize} opacity={0.4} aria-hidden />;
    }

    const definition = getPageType(type);

    if (!definition) {
        return (
            <WarningIcon
                size={iconSize}
                color="var(--mantine-color-yellow-6)"
                role="img"
                aria-label={m['page.unknown_type']({ type })}
            />
        );
    }

    const Icon = definition.icon ?? FileIcon;

    return <Icon size={iconSize} aria-hidden />;
}

export default function NavTreeNode({
    page,
    pages,
    onEdit,
}: {
    page: PageTreeNode;
    pages: Array<PageNode>;
    onEdit: (page: PageTreeNode) => void;
}): ReactElement {
    const hasChildren = page.children.length > 0;
    const editMode = usePageEditMode();
    const [opened, { toggle }] = useDisclosure(true);

    return (
        <Box>
            <Group gap={0} wrap="nowrap" pr="xs">
                <NavLink
                    renderRoot={(props) => (
                        <Link
                            to="/$"
                            params={{
                                _splat: pagePath(pages, page.id).slice(1),
                            }}
                            {...props}
                        />
                    )}
                    label={page.title}
                    leftSection={<PageTypeIcon type={page.type} />}
                    style={{ flex: 1, minWidth: 0 }}
                />

                {hasChildren ? (
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={toggle}
                        aria-label={
                            opened
                                ? m['navbar.page_collapse']({
                                      title: page.title,
                                  })
                                : m['navbar.page_expand']({ title: page.title })
                        }
                    >
                        <CaretRightIcon
                            size={14}
                            style={{
                                transform: opened ? 'rotate(90deg)' : undefined,
                                transition: 'transform 150ms ease',
                            }}
                        />
                    </ActionIcon>
                ) : null}

                {editMode ? (
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => onEdit(page)}
                        aria-label={m['navbar.page_edit']({
                            title: page.title,
                        })}
                    >
                        <PencilSimpleIcon size={14} />
                    </ActionIcon>
                ) : null}
            </Group>

            {hasChildren ? (
                <Collapse expanded={opened}>
                    <Box pl="md">
                        {page.children.map((child) => (
                            <NavTreeNode
                                key={child.id}
                                page={child}
                                pages={pages}
                                onEdit={onEdit}
                            />
                        ))}
                    </Box>
                </Collapse>
            ) : null}
        </Box>
    );
}
