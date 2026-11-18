import { Modal } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import FieldsForm from '#/components/Widgets/FieldsForm';
import {
    splitWidgetConfig,
    widgetConfigFields,
    widgetConfigValues,
} from '#/components/Widgets/config';
import {
    dashboardWidgetsQueryKey,
    updateDashboardWidget,
} from '#/lib/dashboard-widgets';
import { m } from '#/paraglide/messages';

import { getDashboardWidget } from './DashboardWidgets/registry';

import type { DashboardWidgetInstance } from '#/lib/dashboard-widgets';

export default function EditWidgetModal({
    instance,
    onClose,
}: {
    instance: DashboardWidgetInstance | null;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const widget = instance ? getDashboardWidget(instance.type) : undefined;

    return (
        <Modal
            opened={Boolean(instance && widget)}
            onClose={onClose}
            title={m['dashboard.edit_widget']()}
        >
            {instance && widget ? (
                <FieldsForm
                    key={instance.id}
                    fields={widgetConfigFields(widget.fields)}
                    description={widget.description?.()}
                    initialValues={widgetConfigValues(
                        widget.fields,
                        instance.label,
                        instance.config
                    )}
                    submitLabel={m['dashboard.save_widget']()}
                    onSubmit={async (values) => {
                        const { label, config } = splitWidgetConfig(values);

                        await updateDashboardWidget({
                            data: { id: instance.id, label, config },
                        });

                        await queryClient.invalidateQueries({
                            queryKey: dashboardWidgetsQueryKey,
                        });

                        onClose();
                    }}
                />
            ) : null}
        </Modal>
    );
}
