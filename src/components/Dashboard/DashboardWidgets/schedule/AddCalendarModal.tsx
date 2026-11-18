import { useState } from 'react';
import { FileInput, Modal, Stack, Tabs, Text } from '@mantine/core';
import { LinkIcon, UploadSimpleIcon } from '@phosphor-icons/react';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { normalizeFeedUrl } from '#/lib/calendar-url';

import { fileCalendarFields, t, urlCalendarFields } from './schedule';

import type { StoredWidgetValues } from '#/components/Widgets/types';

const MAX_FILE_BYTES = 512 * 1024;

export default function AddCalendarModal({
    opened,
    onClose,
    onSubmitUrl,
    onSubmitFile,
}: {
    opened: boolean;
    onClose: () => void;
    onSubmitUrl: (values: StoredWidgetValues) => Promise<void>;
    onSubmitFile: (
        values: StoredWidgetValues,
        fileName: string,
        text: string
    ) => Promise<void>;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [urlError, setUrlError] = useState<string | null>(null);

    function handleClose() {
        setFile(null);
        setFileError(null);
        setUrlError(null);
        onClose();
    }

    async function handleUrl(values: StoredWidgetValues) {
        const raw = typeof values.url === 'string' ? values.url : '';
        const normalized = normalizeFeedUrl(raw);

        if (normalized === null) {
            setUrlError(t('invalid_url'));
            return;
        }

        setUrlError(null);
        await onSubmitUrl({ ...values, url: normalized });
        handleClose();
    }

    async function handleFile(values: StoredWidgetValues) {
        if (!file) {
            setFileError(t('file_required'));
            return;
        }

        if (file.size > MAX_FILE_BYTES) {
            setFileError(t('file_too_large'));
            return;
        }

        setFileError(null);
        await onSubmitFile(values, file.name, await file.text());
        handleClose();
    }

    return (
        <Modal opened={opened} onClose={handleClose} title={t('add_calendar')}>
            <Tabs defaultValue="url" keepMounted={false}>
                <Tabs.List mb="sm">
                    <Tabs.Tab value="url" leftSection={<LinkIcon size={14} />}>
                        {t('from_link')}
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="file"
                        leftSection={<UploadSimpleIcon size={14} />}
                    >
                        {t('from_file')}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="url">
                    <Stack gap="sm">
                        <FieldsForm
                            fields={urlCalendarFields}
                            submitLabel={t('add_calendar_submit')}
                            onSubmit={handleUrl}
                        />

                        {urlError ? (
                            <Text size="sm" c="red">
                                {urlError}
                            </Text>
                        ) : null}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="file">
                    <Stack gap="sm">
                        <FileInput
                            label={t('ics_file')}
                            description={t('ics_file_hint')}
                            accept=".ics,text/calendar"
                            placeholder="calendar.ics"
                            value={file}
                            onChange={setFile}
                            error={fileError}
                            clearable
                        />

                        <FieldsForm
                            fields={fileCalendarFields}
                            submitLabel={t('upload')}
                            onSubmit={handleFile}
                        />
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
}
