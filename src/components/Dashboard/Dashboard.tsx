import { useState } from 'react';
import { Alert, Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import { PlusIcon, WarningIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fromStoredValues } from '#/components/Widgets/values';
import {
    dashboardWidgetsQueryKey,
    saveDashboardLayout,
    useDashboardWidgets,
    useDashboardWidgetsPending,
} from '#/lib/dashboard-widgets';
import { m } from '#/paraglide/messages';

import AddWidgetModal from './AddWidgetModal';
import DashboardGrid, { changedPlacements } from './DashboardGrid';
import DashboardSkeleton from './DashboardSkeleton';
import { getDashboardWidget } from './DashboardWidgets/registry';
import DeleteWidgetModal from './DeleteWidgetModal';
import EditWidgetModal from './EditWidgetModal';
import WidgetFrame from './WidgetFrame';

import type { DashboardGridPlacement } from './DashboardGrid';
import type { DashboardWidgetInstance } from '#/lib/dashboard-widgets';
import type { ReactElement } from 'react';

export default function Dashboard({
    pageId = null,
}: {
    pageId?: string | null;
}): ReactElement {
    const widgets = useDashboardWidgets(pageId);
    const pending = useDashboardWidgetsPending(pageId);
    const queryClient = useQueryClient();
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const saveLayout = useMutation({
        mutationFn: (items: Array<DashboardGridPlacement>) =>
            saveDashboardLayout({ data: { items } }),
    });

    function handlePlacementChange(placements: Array<DashboardGridPlacement>) {
        const changed = changedPlacements(widgets, placements);

        if (changed.length === 0) return;

        const applied = new Map(
            changed.map((placement) => [placement.id, placement])
        );

        queryClient.setQueryData<Array<DashboardWidgetInstance>>(
            dashboardWidgetsQueryKey(pageId),
            (current) =>
                (current ?? []).map((widget) => {
                    const placement = applied.get(widget.id);

                    return placement ? { ...widget, ...placement } : widget;
                })
        );

        saveLayout.mutate(changed);
    }

    const items = widgets.map((instance) => {
        const widget = getDashboardWidget(instance.type);

        return {
            id: instance.id,
            x: instance.x,
            y: instance.y,
            w: instance.w,
            h: instance.h,
            minW: widget?.defaultSize?.minW,
            minH: widget?.defaultSize?.minH,
            content: (
                <WidgetFrame
                    label={instance.label}
                    onEdit={() => setEditing(instance.id)}
                    onDelete={() => setDeleting(instance.id)}
                >
                    {widget ? (
                        <widget.Component
                            id={instance.id}
                            label={instance.label}
                            config={fromStoredValues(
                                widget.fields,
                                instance.config
                            )}
                        />
                    ) : (
                        <Alert
                            color="yellow"
                            variant="light"
                            icon={<WarningIcon size={16} />}
                        >
                            {m['dashboard.unknown_type']({
                                type: instance.type,
                            })}
                        </Alert>
                    )}
                </WidgetFrame>
            ),
        };
    });

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Box>
                    {pageId === null ? (
                        <Title order={2}>{m['dashboard.title']()}</Title>
                    ) : null}

                    <Text
                        size="sm"
                        c="dimmed"
                        mt={pageId === null ? 4 : undefined}
                    >
                        {m['dashboard.intro']()}
                    </Text>
                </Box>

                <Button
                    leftSection={<PlusIcon size={14} />}
                    variant="filled"
                    onClick={() => setAdding(true)}
                    style={{ flexShrink: 0 }}
                >
                    {m['dashboard.add_widget']()}
                </Button>
            </Group>

            {pending ? (
                <DashboardSkeleton />
            ) : items.length > 0 ? (
                <DashboardGrid
                    items={items}
                    onPlacementChange={handlePlacementChange}
                />
            ) : (
                <Text size="sm" c="dimmed">
                    {m['dashboard.empty']()}
                </Text>
            )}

            <AddWidgetModal
                pageId={pageId}
                opened={adding}
                onClose={() => setAdding(false)}
            />

            <EditWidgetModal
                pageId={pageId}
                instance={
                    widgets.find((widget) => widget.id === editing) ?? null
                }
                onClose={() => setEditing(null)}
            />

            <DeleteWidgetModal
                pageId={pageId}
                instance={
                    widgets.find((widget) => widget.id === deleting) ?? null
                }
                onClose={() => setDeleting(null)}
            />
        </Stack>
    );
}
