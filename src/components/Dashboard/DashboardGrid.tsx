import GridLayout, { useContainerWidth } from 'react-grid-layout';

import type { ReactElement, ReactNode } from 'react';
import type { Layout } from 'react-grid-layout';

export interface DashboardGridItem {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    content: ReactNode;
}

export interface DashboardGridPlacement {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export const dragHandleClass = 'widget-drag-handle';

export function changedPlacements(
    current: ReadonlyArray<DashboardGridPlacement>,
    next: ReadonlyArray<DashboardGridPlacement>
): Array<DashboardGridPlacement> {
    const byId = new Map(current.map((item) => [item.id, item]));

    return next.filter((placement) => {
        const item = byId.get(placement.id);

        return (
            item !== undefined &&
            (item.x !== placement.x ||
                item.y !== placement.y ||
                item.w !== placement.w ||
                item.h !== placement.h)
        );
    });
}

const cols = 12;
const rowHeight = 60;
const margin: [number, number] = [12, 12];

export default function DashboardGrid({
    items,
    onPlacementChange,
}: {
    items: Array<DashboardGridItem>;
    onPlacementChange: (placements: Array<DashboardGridPlacement>) => void;
}): ReactElement {
    const { width, containerRef, mounted } = useContainerWidth({
        measureBeforeMount: true,
    });

    const layout: Layout = items.map((item) => ({
        i: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW ?? 1,
        minH: item.minH ?? 2,
    }));

    function handleLayoutChange(next: Layout) {
        onPlacementChange(
            next.map((item) => ({
                id: item.i,
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
            }))
        );
    }

    return (
        <div ref={containerRef} className="dashboard-grid">
            {mounted ? (
                <GridLayout
                    width={width}
                    layout={layout}
                    onLayoutChange={handleLayoutChange}
                    gridConfig={{
                        cols,
                        rowHeight,
                        margin,
                        containerPadding: [0, 0],
                    }}
                    dragConfig={{
                        handle: `.${dragHandleClass}`,
                        allowMobileScroll: true,
                    }}
                    resizeConfig={{ handles: ['se'] }}
                >
                    {items.map((item) => (
                        <div key={item.id}>{item.content}</div>
                    ))}
                </GridLayout>
            ) : null}
        </div>
    );
}
