import { useState } from 'react';
import { ActionIcon, Box, Group } from '@mantine/core';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fromStoredValues } from '#/components/Widgets/values';
import {
    headerWidgetsQueryKey,
    reorderHeaderWidgets,
    useHeaderWidgets,
} from '#/lib/header-widgets';
import { m } from '#/paraglide/messages';

import DeleteHeaderWidgetModal from '../DeleteHeaderWidgetModal';
import EditHeaderWidgetModal from '../EditHeaderWidgetModal';
import { getHeaderWidget } from './registry';

import type { HeaderWidgetInstance } from '#/lib/header-widgets';
import type { DragEndEvent } from '@dnd-kit/core';

export default function HeaderWidgetBar() {
    const instances = useHeaderWidgets();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const reorder = useMutation({
        mutationFn: (ids: Array<string>) =>
            reorderHeaderWidgets({ data: { ids } }),
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: headerWidgetsQueryKey }),
    });

    const ordered = [...instances].sort(
        (a, b) => a.position - b.position || a.id.localeCompare(b.id)
    );
    const ids = ordered.map((instance) => instance.id);

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (!over || active.id === over.id) return;

        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));

        if (from === -1 || to === -1) return;

        const next = arrayMove(ordered, from, to).map((instance, index) => ({
            ...instance,
            position: index,
        }));

        queryClient.setQueryData(headerWidgetsQueryKey, next);
        reorder.mutate(next.map((instance) => instance.id));
    }

    return (
        <>
            <Group
                gap="lg"
                wrap="nowrap"
                justify="center"
                visibleFrom="sm"
                style={{ minWidth: 0, overflow: 'hidden' }}
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={ids}
                        strategy={horizontalListSortingStrategy}
                    >
                        {ordered.map((instance) => (
                            <SortableWidget
                                key={instance.id}
                                instance={instance}
                                onEdit={() => setEditing(instance.id)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </Group>

            <EditHeaderWidgetModal
                instance={
                    ordered.find((instance) => instance.id === editing) ?? null
                }
                onClose={() => setEditing(null)}
                onRequestDelete={() => {
                    setDeleting(editing);
                    setEditing(null);
                }}
            />

            <DeleteHeaderWidgetModal
                instance={
                    ordered.find((instance) => instance.id === deleting) ?? null
                }
                onCancel={() => {
                    setEditing(deleting);
                    setDeleting(null);
                }}
                onDeleted={() => setDeleting(null)}
            />
        </>
    );
}

function SortableWidget({
    instance,
    onEdit,
}: {
    instance: HeaderWidgetInstance;
    onEdit: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: instance.id });

    const widget = getHeaderWidget(instance.type);

    if (!widget) return null;

    return (
        <Group
            ref={setNodeRef}
            gap={2}
            wrap="nowrap"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
            }}
        >
            <ActionIcon
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={m['header.widget_reorder']({
                    label: instance.label,
                })}
                style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                }}
            >
                <DotsSixVerticalIcon size={14} />
            </ActionIcon>

            <Box style={{ textAlign: 'center' }}>
                <widget.Component
                    id={instance.id}
                    label={instance.label}
                    config={fromStoredValues(widget.fields, instance.config)}
                />
            </Box>

            <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={onEdit}
                aria-label={m['header.widget_edit']({ label: instance.label })}
            >
                <PencilSimpleIcon size={14} />
            </ActionIcon>
        </Group>
    );
}
