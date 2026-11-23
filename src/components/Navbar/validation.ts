import { z } from 'zod';

import { widgetValuesObject } from '#/components/Widgets/validation';
import { m } from '#/paraglide/messages';

import type { WidgetField } from '#/components/Widgets/types';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function pageShape() {
    return {
        title: z.string().min(1, {
            error: () => m['navbar.page_form.required'](),
        }),
        slug: z
            .string()
            .min(1, { error: () => m['navbar.page_form.required']() })
            .regex(slugPattern, {
                error: () => m['navbar.page_form.invalid_address'](),
            }),
        position: z
            .number({ error: () => m['navbar.page_form.invalid_number']() })
            .int({ error: () => m['navbar.page_form.invalid_number']() })
            .min(0, { error: () => m['navbar.page_form.invalid_number']() }),
        parentId: z.string(),
    };
}

export function pageFormSchema() {
    return z.object(pageShape());
}

export function newPageFormSchema(fields: ReadonlyArray<WidgetField>) {
    return z.object({ ...pageShape(), values: widgetValuesObject(fields) });
}
