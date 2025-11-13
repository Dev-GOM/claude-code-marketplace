'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CopyInstallButtonProps {
  readonly pluginName: string;
  readonly categoryBg: string;
}

export function CopyInstallButton({
  pluginName,
  categoryBg,
}: CopyInstallButtonProps): React.ReactElement {
  const [copied, setCopied] = useState<boolean>(false);
  const { t } = useLanguage();

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(`/plugin install ${pluginName}@dev-gom-plugins`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      // Clipboard API 실패 - 모던 브라우저에서는 거의 발생하지 않음
      console.error('Failed to copy to clipboard');
    }
  };

  return (
    <button
      className={`group relative px-6 py-3 bg-gradient-to-r ${categoryBg} text-white rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg`}
      onClick={handleCopy}
      aria-label={copied ? t('Installation command copied!', '설치 명령어가 복사되었습니다!') : t('Copy installation command', '설치 명령어 복사')}
      title={copied ? t('Copied!', '복사됨!') : t('Copy install command', '설치 명령어 복사')}
    >
      <span className="relative z-10">
        {copied ? t('✅ Copied!', '✅ 복사됨!') : t('📦 Copy Install Command', '📦 설치 명령어 복사')}
      </span>
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${categoryBg} rounded-xl opacity-50 blur group-hover:opacity-75 transition-opacity`}
      />
    </button>
  );
}
