'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { MarkdownContent } from '@/components/MarkdownContent';
import { preprocessMarkdown } from '@/lib/utils/markdown';
import type { PluginWithReadme } from '@/lib/types';

interface PluginDetailReadmeProps {
  readonly plugin: PluginWithReadme;
}

export function PluginDetailReadme({ plugin }: PluginDetailReadmeProps): React.ReactElement {
  const { language } = useLanguage();

  // 언어별 README 선택
  const readme = language === 'ko' && plugin.readmeKo ? plugin.readmeKo : plugin.readme;
  const processedReadme = preprocessMarkdown(readme);

  return (
    <div className="relative mb-12">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur" />
      <div className="relative bg-white/8 rounded-3xl p-8 border border-white/10">
        <MarkdownContent content={processedReadme} />
      </div>
    </div>
  );
}
