import { ArticleIcon } from '@phosphor-icons/react';

import { valueText } from '#/components/Widgets/values';
import { useArticle, useArticlePending } from '#/lib/articles';

import ArticleBody from './article/ArticleBody';
import ArticleSkeleton from './article/ArticleSkeleton';
import { t } from './article/i18n';

import type { PageTypeMeta, PageTypeProps } from './types';

export const widgetMeta = {
    type: 'article',
    label: () => t('label'),
    description: () => t('description'),
    icon: ArticleIcon,
    fields: [
        {
            kind: 'switch',
            name: 'toc',
            label: () => t('toc'),
            description: () => t('toc_hint'),
            defaultValue: true,
        },
        {
            kind: 'select',
            name: 'width',
            label: () => t('width'),
            defaultValue: 'readable',
            options: () => [
                { value: 'readable', label: t('width_readable') },
                { value: 'full', label: t('width_full') },
            ],
        },
    ],
} satisfies PageTypeMeta;

export default function ArticlePageType({ pageId, config }: PageTypeProps) {
    const { content } = useArticle(pageId);
    const pending = useArticlePending(pageId);

    if (pending) return <ArticleSkeleton />;

    return (
        <ArticleBody
            key={pageId}
            pageId={pageId}
            initialContent={content}
            showOutline={config.toc !== false}
            readable={valueText(config, 'width') !== 'full'}
        />
    );
}
