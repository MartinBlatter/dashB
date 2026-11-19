import { useState } from 'react';
import { Modal, Select, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import FieldsForm from '#/components/Widgets/FieldsForm';
import {
    splitWidgetConfig,
    widgetConfigFields,
    widgetConfigValues,
} from '#/components/Widgets/config';
import {
    createDashboardWidget,
    dashboardWidgetsQueryKey,
} from '#/lib/dashboard-widgets';
import { m } from '#/paraglide/messages';

import {
    dashboardWidgetOptions,
    getDashboardWidget,
} from './DashboardWidgets/registry';

export default function AddWidgetModal({
    pageId,
    opened,
    onClose,
}: {
    pageId: string | null;
    opened: boolean;
    onClose: () => void;
}) {
    const [type, setType] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const options = dashboardWidgetOptions();
    const selected = type ? getDashboardWidget(type) : undefined;

    function handleClose() {
        onClose();
        setType(null);
    }

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={m['dashboard.add_widget']()}
        >
            <Stack gap="sm">
                <Select
                    label={m['dashboard.widget_type']()}
                    placeholder={m['dashboard.widget_type_placeholder']()}
                    data={options}
                    value={type}
                    onChange={setType}
                    searchable
                    nothingFoundMessage={m['dashboard.widget_type_empty']()}
                />

                {selected ? (
                    <FieldsForm
                        key={selected.type}
                        fields={widgetConfigFields(selected.fields)}
                        description={selected.description?.()}
                        initialValues={widgetConfigValues(
                            selected.fields,
                            selected.label(),
                            {}
                        )}
                        submitLabel={m['dashboard.add_widget_submit']()}
                        onSubmit={async (values) => {
                            const { label, config } = splitWidgetConfig(values);

                            await createDashboardWidget({
                                data: {
                                    pageId,
                                    type: selected.type,
                                    label,
                                    config,
                                    w: selected.defaultSize?.w,
                                    h: selected.defaultSize?.h,
                                },
                            });

                            await queryClient.invalidateQueries({
                                queryKey: dashboardWidgetsQueryKey(pageId),
                            });

                            handleClose();
                        }}
                    />
                ) : null}
            </Stack>
        </Modal>
    );
}
