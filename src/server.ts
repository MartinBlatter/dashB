import handler from '@tanstack/react-start/server-entry';

import { startDemoReset } from '#/lib/demo-reset';
import { paraglideMiddleware } from '#/paraglide/server';

startDemoReset(process.env.DEMO_RESET_AT);

export default {
    fetch(request: Request): Promise<Response> {
        return paraglideMiddleware(request, () => handler.fetch(request));
    },
};
