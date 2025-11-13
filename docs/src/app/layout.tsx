import type { Metadata } from 'next';
import { Fredoka, DM_Sans, Fira_Code } from 'next/font/google';
import '../styles/globals.css';
import { SITE_CONFIG } from '@/lib/constants';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: SITE_CONFIG.TITLE,
  description: SITE_CONFIG.DESCRIPTION,
  keywords: [
    'Claude Code',
    'plugins',
    'productivity',
    'automation',
    'development',
  ],
  authors: [{ name: SITE_CONFIG.AUTHOR }],
  openGraph: {
    title: SITE_CONFIG.TITLE,
    description: SITE_CONFIG.DESCRIPTION,
    url: SITE_CONFIG.GITHUB_URL,
    siteName: SITE_CONFIG.TITLE,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.TITLE,
    description: SITE_CONFIG.DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fredoka.variable} ${dmSans.variable} ${firaCode.variable}`}>
        <ThemeProvider>
          <LanguageProvider>
            <div className="min-h-screen flex flex-col relative">
              <Header />
              <main className="flex-1 relative z-10">{children}</main>
              <Footer />
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
