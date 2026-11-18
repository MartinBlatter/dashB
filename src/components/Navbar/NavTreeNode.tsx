import { ActionIcon, Box, Collapse, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CaretRightIcon, PencilSimpleIcon } from '@phosphor-icons/react';

import { m } from '#/paraglide/messages';

import { usePageEditMode } from './edit-mode';

import type { PageTreeNode } from '#/lib/pages';
import type { ReactElement } from 'react';

export default function NavTreeNode({
    page,
    onEdit,
}: {
    page: PageTreeNode;
    onEdit: (page: PageTreeNode) => void;
}): ReactElement {
    const hasChildren = page.children.length > 0;
    const editMode = usePageEditMode();
    const [opened, { toggle }] = useDisclosure(true);

    return (
        <Box>
            <Group gap={0} wrap="nowrap" pr="xs">
                <NavLink
                    href={`/${page.slug}`}
                    label={page.title}
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
                                onEdit={onEdit}
                            />
                        ))}
                    </Box>
                </Collapse>
            ) : null}
        </Box>
    );
}
