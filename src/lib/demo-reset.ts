import { prisma } from '#/db';

export interface ResetTime {
    hour: number;
    minute: number;
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/u;

export function parseResetTime(value: string | undefined): ResetTime | null {
    if (value === undefined) return null;

    const match = timePattern.exec(value.trim());

    if (match === null) return null;

    return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function nextResetAt(now: Date, time: ResetTime): Date {
    const next = new Date(now);

    next.setHours(time.hour, time.minute, 0, 0);

    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);

    return next;
}

export function previousResetAt(now: Date, time: ResetTime): Date {
    const previous = nextResetAt(now, time);

    previous.setDate(previous.getDate() - 1);

    return previous;
}

export async function catchUpDemoReset(
    now: Date,
    time: ResetTime
): Promise<number> {
    const missed = await prisma.user.count({
        where: { createdAt: { lt: previousResetAt(now, time) } },
    });

    if (missed === 0) return 0;

    return await resetDemoData();
}

export async function resetDemoData(): Promise<number> {
    const users = await prisma.user.deleteMany();

    await prisma.verification.deleteMany();

    try {
        await prisma.$executeRaw`VACUUM`;
    } catch (error) {
        console.warn(`demo-reset: VACUUM skipped (${describe(error)})`);
    }

    return users.count;
}

export function startDemoReset(value: string | undefined): boolean {
    const time = parseResetTime(value);

    if (time === null) return false;

    catchUpDemoReset(new Date(), time)
        .then((count) => {
            if (count > 0) {
                console.log(
                    `demo-reset: caught up a missed reset, removed ${count} account(s)`
                );
            }
        })
        .catch((error: unknown) => {
            console.error(`demo-reset: catch-up failed (${describe(error)})`);
        });

    scheduleReset(time);

    return true;
}

function scheduleReset(time: ResetTime): void {
    const at = nextResetAt(new Date(), time);

    console.log(`demo-reset: next reset at ${at.toISOString()}`);

    setTimeout(() => {
        runReset(time);
    }, at.getTime() - Date.now()).unref();
}

function runReset(time: ResetTime): void {
    resetDemoData()
        .then((count) => {
            console.log(`demo-reset: removed ${count} account(s)`);
        })
        .catch((error: unknown) => {
            console.error(`demo-reset: failed (${describe(error)})`);
        })
        .finally(() => {
            scheduleReset(time);
        });
}

function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
