export const chartRampSteps = 5;

export const chartMinBar = '2px';

export function chartRampIndex(level: number): number {
    if (!Number.isFinite(level) || level <= 0) return 0;

    return Math.max(
        1,
        Math.min(chartRampSteps, Math.ceil(level * chartRampSteps))
    );
}

export function chartMax(values: ReadonlyArray<number>): number {
    let max = 0;

    for (const value of values) {
        if (Number.isFinite(value) && value > max) max = value;
    }

    return max > 0 ? max : 1;
}

export function chartBarHeight(value: number, max: number): string | null {
    if (!Number.isFinite(value) || value <= 0) return null;

    const pct = Math.min(100, (value / max) * 100);

    return `max(${chartMinBar}, ${pct.toFixed(2)}%)`;
}
