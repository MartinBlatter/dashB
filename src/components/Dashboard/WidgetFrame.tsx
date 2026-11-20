import { ActionIcon, Box, Group, Menu, Paper, Text } from '@mantine/core';
import {
    DotsSixVerticalIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { m } from '#/paraglide/messages';

import { dragHandleClass } from './DashboardGrid';

import type { ReactNode } from 'react';

export default function WidgetFrame({
    label,
    onEdit,
    onDelete,
    children,
}: {
    label: string;
    onEdit: () => void;
    onDelete: () => void;
    children: ReactNode;
}) {
    return (
        <Paper
            withBorder
            radius="md"
            h="100%"
            style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
            }}
        >
            <Group
                gap={4}
                wrap="nowrap"
                px="xs"
                py={6}
                bg="var(--mantine-primary-color-filled)"
                c="var(--mantine-primary-color-contrast)"
                className={dragHandleClass}
                style={{
                    cursor: 'grab',
                    touchAction: 'none',
                    borderBottom:
                        '1px solid var(--mantine-color-default-border)',
                }}
                aria-label={m['dashboard.widget_drag']({ label })}
            >
                <DotsSixVerticalIcon size={14} opacity={0.5} />

                <Text
                    size="sm"
                    fw={500}
                    truncate
                    style={{
                        flex: 1,
                    }}
                >
                    {label}
                </Text>

                <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={m['dashboard.widget_menu']({ label })}
                            onPointerDown={(event) => event.stopPropagation()}
                        >
                            <DotsThreeVerticalIcon size={14} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<PencilSimpleIcon size={14} />}
                            onClick={onEdit}
                        >
                            {m['dashboard.edit_widget']()}
                        </Menu.Item>
                        <Menu.Item
                            color="red"
                            leftSection={<TrashIcon size={14} />}
                            onClick={onDelete}
                        >
                            {m['dashboard.delete_widget']()}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <Box
                px="xs"
                py="xs"
                style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
            >
                {children}
            </Box>
        </Paper>
    );
}
