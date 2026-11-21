import { createFileRoute } from '@tanstack/react-router';
import { handleDocumentRequest } from '#/lib/document-files';

export const Route = createFileRoute('/api/documents/$')({
    server: {
        handlers: {
            GET: ({ request }) => handleDocumentRequest(request),
            POST: ({ request }) => handleDocumentRequest(request),
        },
    },
});
