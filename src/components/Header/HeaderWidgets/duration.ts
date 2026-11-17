export function formatDuration(
    ms: number,
    { withSeconds, daySuffix }: { withSeconds: boolean; daySuffix: string }
): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    const pad = (value: number) => String(value).padStart(2, '0');

    const clock = withSeconds
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}`;

    return days > 0 ? `${days}${daySuffix} ${clock}` : clock;
}
