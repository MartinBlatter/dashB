export const imageTooLargeError = 'IMAGE_TOO_LARGE';
export const imageUnreadableError = 'IMAGE_UNREADABLE';

const maxInlineImageLength = 1_200_000;
const maxEdges = [1600, 1200, 900];
const qualities = [0.82, 0.62, 0.45];

export async function toInlineImageUrl(file: File): Promise<string> {
    const downscaled = await encodeDownscaled(file);

    if (downscaled !== null) return downscaled;

    const raw = await readDataUrl(file);

    if (raw.length <= maxInlineImageLength) return raw;

    throw new Error(imageTooLargeError);
}

async function encodeDownscaled(file: File): Promise<string | null> {
    const bitmap = await createBitmap(file);

    if (!bitmap) return null;

    try {
        for (const edge of maxEdges) {
            const canvas = drawScaled(bitmap, edge);

            if (!canvas) return null;

            for (const quality of qualities) {
                const url = canvas.toDataURL('image/webp', quality);

                if (url.length <= maxInlineImageLength) return url;
            }
        }
    } finally {
        bitmap.close();
    }

    return null;
}

async function createBitmap(file: File): Promise<ImageBitmap | null> {
    try {
        return await createImageBitmap(file);
    } catch {
        return null;
    }
}

function drawScaled(
    bitmap: ImageBitmap,
    maxEdge: number
): HTMLCanvasElement | null {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxEdge / longest);
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');

    if (!context) return null;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return canvas;
}

function readDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () =>
            resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error(imageUnreadableError));
        reader.readAsDataURL(file);
    });
}
