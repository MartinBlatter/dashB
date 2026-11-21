import { useEffect, useState } from 'react';

import { documentFileUrl } from '#/lib/page-documents';

export type DocumentFile =
    | { status: 'loading'; url: null }
    | { status: 'ready'; url: string }
    | { status: 'error'; url: null };

const loading: DocumentFile = { status: 'loading', url: null };

export function useDocumentFile(id: string | null): DocumentFile {
    const [file, setFile] = useState<DocumentFile>(loading);

    useEffect(() => {
        if (id === null) return;

        const controller = new AbortController();

        let objectUrl: string | null = null;

        setFile(loading);

        const load = async () => {
            try {
                const response = await fetch(documentFileUrl(id), {
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error(String(response.status));

                objectUrl = URL.createObjectURL(await response.blob());

                setFile({ status: 'ready', url: objectUrl });
            } catch {
                if (!controller.signal.aborted) {
                    setFile({ status: 'error', url: null });
                }
            }
        };

        void load();

        return () => {
            controller.abort();

            if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    return file;
}
