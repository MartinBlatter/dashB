import { z } from 'zod';

import { m } from '#/paraglide/messages';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function pageFormSchema() {
    return z.object({
        title: z.string().min(1, {
            error: () => m['navbar.page_form.required'](),
        }),
        slug: z
            .string()
            .min(1, { error: () => m['navbar.page_form.required']() })
            .regex(slugPattern, {
                error: () => m['navbar.page_form.invalid_slug'](),
            }),
        position: z
            .number({ error: () => m['navbar.page_form.invalid_number']() })
            .int({ error: () => m['navbar.page_form.invalid_number']() })
            .min(0, { error: () => m['navbar.page_form.invalid_number']() }),
        parentId: z.string(),
    });
}
