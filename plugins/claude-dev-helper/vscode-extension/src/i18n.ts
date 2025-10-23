/**
 * Internationalization support
 */

interface Messages {
    accept: string;
    reject: string;
    acceptAll: string;
    rejectAll: string;
    acceptedChange: string;
    rejectedChange: string;
    noChanges: string;
    failed: string;
    gitChange: string;
    lines: string;
    keyboardHint: string;
}

const translations: { [locale: string]: Messages } = {
    'en': {
        accept: 'Accept',
        reject: 'Reject',
        acceptAll: 'Accept All',
        rejectAll: 'Reject All',
        acceptedChange: 'Accepted changes at lines',
        rejectedChange: 'Rejected changes at lines',
        noChanges: 'No changes to',
        failed: 'Failed to',
        gitChange: 'Git Change',
        lines: 'lines',
        keyboardHint: 'Keyboard shortcuts'
    },
    'ko': {
        accept: '수락',
        reject: '거부',
        acceptAll: '모두 수락',
        rejectAll: '모두 거부',
        acceptedChange: '변경사항 수락됨 (라인',
        rejectedChange: '변경사항 거부됨 (라인',
        noChanges: '변경사항 없음',
        failed: '실패',
        gitChange: 'Git 변경사항',
        lines: '라인',
        keyboardHint: '키보드 단축키'
    }
};

class I18n {
    private locale: string;
    private messages: Messages;

    constructor() {
        // Get VS Code language
        const vscodeLocale = JSON.parse(process.env.VSCODE_NLS_CONFIG || '{}').locale || 'en';

        // Map locale to supported language
        this.locale = vscodeLocale.startsWith('ko') ? 'ko' : 'en';
        this.messages = translations[this.locale];
    }

    t(key: keyof Messages): string {
        return this.messages[key] || key;
    }

    getLocale(): string {
        return this.locale;
    }
}

export const i18n = new I18n();
