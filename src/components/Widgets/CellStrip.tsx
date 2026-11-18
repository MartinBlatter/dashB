import { useState } from 'react';
import { Box, Text } from '@mantine/core';

import { chartRampIndex } from './charts';

import classes from './charts.module.css';

export interface CellStripDatum {
    key: string;
    label: string;
    level: number;
    detail: string;
}

export interface CellStripProps {
    data: ReadonlyArray<CellStripDatum>;
    columns?: number;
    emptyLabel: string;
}

export default function CellStrip({
    data,
    columns = 7,
    emptyLabel,
}: CellStripProps) {
    const [hovered, setHovered] = useState<number | null>(null);

    if (data.length === 0) {
        return (
            <Text size="sm" c="dimmed">
                {emptyLabel}
            </Text>
        );
    }

    const activeIndex = hovered ?? data.length - 1;
    const active = data[activeIndex];

    return (
        <Box className={classes.chart}>
            <div
                className={classes.cells}
                style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
            >
                {data.map((datum, index) => (
                    <button
                        key={datum.key}
                        type="button"
                        className={classes.cell}
                        data-level={chartRampIndex(datum.level)}
                        data-active={index === hovered}
                        aria-label={`${datum.label}: ${datum.detail}`}
                        onMouseEnter={() => setHovered(index)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(index)}
                        onBlur={() => setHovered(null)}
                    />
                ))}
            </div>

            <Text size="xs" c="dimmed" mt={4} truncate>
                {`${active.label} · ${active.detail}`}
            </Text>
        </Box>
    );
}
