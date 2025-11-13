'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { PluginWithReadme } from '@/lib/types';

interface PluginDetailInstallProps {
  readonly plugin: PluginWithReadme;
}

export function PluginDetailInstall({ plugin }: PluginDetailInstallProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur" />
      <div className="relative bg-white/8 rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-3xl">🚀</span>
          {t('Quick Installation', '빠른 설치')}
        </h2>
        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
          <code className="text-pink-400">
            /plugin install {plugin.name}@dev-gom-plugins
          </code>
        </div>
        <p className="text-white/70 text-sm mt-4">
          {t(
            'Run this command in Claude Code to install the plugin.',
            'Claude Code에서 이 명령어를 실행하여 플러그인을 설치하세요.'
          )}
        </p>
      </div>
    </div>
  );
}
