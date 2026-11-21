import { getLocale } from '#/paraglide/runtime';

import type { TreeNodeData } from '@mantine/core';
import type { DocumentNode } from '#/lib/page-documents';

export function compareNodes(a: DocumentNode, b: DocumentNode): number {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;

    return a.name.localeCompare(b.name, getLocale(), { numeric: true });
}

export function groupByParent(
    nodes: ReadonlyArray<DocumentNode>
): Map<string | null, Array<DocumentNode>> {
    const groups = new Map<string | null, Array<DocumentNode>>();

    for (const node of nodes) {
        const siblings = groups.get(node.parentId);

        if (siblings) siblings.push(node);
        else groups.set(node.parentId, [node]);
    }

    for (const siblings of groups.values()) siblings.sort(compareNodes);

    return groups;
}

export function buildTreeData(
    nodes: ReadonlyArray<DocumentNode>
): Array<TreeNodeData> {
    const groups = groupByParent(nodes);

    function branch(parentId: string | null): Array<TreeNodeData> {
        return (groups.get(parentId) ?? []).map((node) =>
            node.kind === 'folder'
                ? {
                      value: node.id,
                      label: node.name,
                      hasChildren: true,
                      children: branch(node.id),
                  }
                : { value: node.id, label: node.name }
        );
    }

    return branch(null);
}

export function childCounts(
    nodes: ReadonlyArray<DocumentNode>
): Map<string, number> {
    const counts = new Map<string, number>();

    for (const node of nodes) {
        if (node.parentId === null) continue;

        counts.set(node.parentId, (counts.get(node.parentId) ?? 0) + 1);
    }

    return counts;
}

export function findNode(
    nodes: ReadonlyArray<DocumentNode>,
    id: string | null
): DocumentNode | null {
    if (id === null) return null;

    return nodes.find((node) => node.id === id) ?? null;
}

export function destinationFolderId(
    nodes: ReadonlyArray<DocumentNode>,
    selectedId: string | null
): string | null {
    const selected = findNode(nodes, selectedId);

    if (!selected) return null;

    return selected.kind === 'folder' ? selected.id : selected.parentId;
}

export function siblingNames(
    nodes: ReadonlyArray<DocumentNode>,
    parentId: string | null,
    exceptId?: string
): Set<string> {
    return new Set(
        nodes
            .filter(
                (node) => node.parentId === parentId && node.id !== exceptId
            )
            .map((node) => node.name)
    );
}
