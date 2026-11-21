import { ActionIcon, Box, Group, Menu, Text, Tree } from '@mantine/core';
import {
    ArrowLineUpIcon,
    CaretRightIcon,
    DotsThreeVerticalIcon,
    FolderPlusIcon,
    PencilSimpleIcon,
    TrashIcon,
    UploadSimpleIcon,
} from '@phosphor-icons/react';

import { isDescendant } from '#/lib/page-documents';

import { documentIcon, formatSize } from './format';
import { t } from './i18n';
import { siblingNames } from './tree';

import type {
    RenderTreeNodePayload,
    TreeDragDropPayload,
    TreeNodeData,
    UseTreeReturnType,
} from '@mantine/core';
import type { DocumentNode } from '#/lib/page-documents';

function metaText(node: DocumentNode, childCount: number): string {
    if (node.kind === 'file') return formatSize(node.size);
    if (childCount === 0) return t('folder_empty_count');
    if (childCount === 1) return t('folder_counts_one');

    return `${childCount} ${t('folder_counts_many')}`;
}

export default function DocumentsTree({
    nodes,
    data,
    counts,
    tree,
    onNewFolder,
    onUploadInto,
    onRename,
    onDelete,
    onMove,
}: {
    nodes: ReadonlyArray<DocumentNode>;
    data: Array<TreeNodeData>;
    counts: Map<string, number>;
    tree: UseTreeReturnType;
    onNewFolder: (parentId: string) => void;
    onUploadInto: (parentId: string) => void;
    onRename: (node: DocumentNode) => void;
    onDelete: (node: DocumentNode) => void;
    onMove: (id: string, parentId: string | null) => void;
}) {
    const byId = new Map(nodes.map((node) => [node.id, node]));

    function targetParentId(payload: TreeDragDropPayload): string | null {
        const target = byId.get(payload.targetNode);

        if (!target) return null;

        return payload.position === 'inside' ? target.id : target.parentId;
    }

    function allowDrop(payload: TreeDragDropPayload): boolean {
        const dragged = byId.get(payload.draggedNode);
        const target = byId.get(payload.targetNode);

        if (!dragged || !target) return false;
        if (payload.position === 'inside' && target.kind !== 'folder') {
            return false;
        }

        const parentId = targetParentId(payload);

        if (parentId === dragged.parentId) return false;
        if (isDescendant(nodes, dragged.id, parentId)) return false;

        return !siblingNames(nodes, parentId, dragged.id).has(dragged.name);
    }

    function renderNode(payload: RenderTreeNodePayload) {
        const node = byId.get(payload.node.value);

        if (!node) return null;

        const NodeIcon = documentIcon(node);

        return (
            <div {...payload.elementProps}>
                <Group gap={6} wrap="nowrap" justify="space-between">
                    <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        {payload.hasChildren ? (
                            <CaretRightIcon
                                size={12}
                                aria-hidden
                                style={{
                                    flexShrink: 0,
                                    transform: payload.expanded
                                        ? 'rotate(90deg)'
                                        : undefined,
                                    transition: 'transform 150ms ease',
                                }}
                            />
                        ) : (
                            <Box w={12} style={{ flexShrink: 0 }} />
                        )}

                        <NodeIcon
                            size={16}
                            aria-hidden
                            style={{ flexShrink: 0 }}
                        />

                        <Text size="sm" truncate>
                            {node.name}
                        </Text>
                    </Group>

                    <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                        <Text size="xs" c="dimmed">
                            {metaText(node, counts.get(node.id) ?? 0)}
                        </Text>

                        <Menu position="bottom-end" withinPortal>
                            <Menu.Target>
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    aria-label={t('node_menu')}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <DotsThreeVerticalIcon size={14} />
                                </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                                {node.kind === 'folder' ? (
                                    <>
                                        <Menu.Item
                                            leftSection={
                                                <UploadSimpleIcon size={14} />
                                            }
                                            onClick={() =>
                                                onUploadInto(node.id)
                                            }
                                        >
                                            {t('upload_into')}
                                        </Menu.Item>

                                        <Menu.Item
                                            leftSection={
                                                <FolderPlusIcon size={14} />
                                            }
                                            onClick={() => onNewFolder(node.id)}
                                        >
                                            {t('new_subfolder')}
                                        </Menu.Item>

                                        <Menu.Divider />
                                    </>
                                ) : null}

                                <Menu.Item
                                    leftSection={<PencilSimpleIcon size={14} />}
                                    onClick={() => onRename(node)}
                                >
                                    {t('rename')}
                                </Menu.Item>

                                <Menu.Item
                                    leftSection={<ArrowLineUpIcon size={14} />}
                                    disabled={node.parentId === null}
                                    onClick={() => onMove(node.id, null)}
                                >
                                    {t('move_to_root')}
                                </Menu.Item>

                                <Menu.Divider />

                                <Menu.Item
                                    color="red"
                                    leftSection={<TrashIcon size={14} />}
                                    onClick={() => onDelete(node)}
                                >
                                    {t('delete')}
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </div>
        );
    }

    return (
        <Tree
            aria-label={t('tree_label')}
            data={data}
            tree={tree}
            levelOffset={20}
            selectOnClick
            allowRangeSelection={false}
            withLines
            renderNode={renderNode}
            allowDrop={allowDrop}
            onDragDrop={(payload) =>
                onMove(payload.draggedNode, targetParentId(payload))
            }
        />
    );
}
